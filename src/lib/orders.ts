import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { formatPrice } from "@/lib/products";
import Stripe from "stripe";

export async function processCompletedCheckout(
    session: Stripe.Checkout.Session,
    forceEmail: boolean = false
): Promise<{ orderId: string; alreadyProcessed: boolean }> {
    console.log("[orders] processing session:", session.id, forceEmail ? "(force email)" : "");

    const supabase = getSupabaseAdmin() as any;

    // 1. Check if order exists
    const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

    const alreadyProcessed = !!existing;
    let orderId = existing?.id;

    // 2. If it exists and we DON'T need to force an email, we can exit early
    if (alreadyProcessed && !forceEmail) {
        console.log("[orders] Order already recorded for session:", session.id);
        return { orderId, alreadyProcessed: true };
    }

    // 3. Retrieve full session with line items (Needed for both New Orders and Resends)
    const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "line_items.data.price.product"],
    });

    const lineItems = fullSession.line_items?.data ?? [];
    // @ts-ignore
    const shippingDetails = fullSession.shipping_details ?? (session as any).shipping_details;
    const customerName =
        shippingDetails?.name ?? session.metadata?.ship_to_name ?? "Unknown";
    const totalPence = fullSession.amount_total ?? 0;

    // 4. Record the order if it doesn't exist yet
    if (!alreadyProcessed) {
        // Since we pass shipping as a line item, fullSession.shipping_cost might be empty.
        // We prioritize our custom metadata if available.
        const shippingPence = 
            parseInt(session.metadata?.shipping_pence || "0", 10) || 
            fullSession.shipping_cost?.amount_total || 0;
            
        const subtotalPence = totalPence - shippingPence;
        const addr = shippingDetails?.address;
        const email = session.customer_details?.email ?? session.customer_email ?? session.metadata?.email ?? "";

        const shippingAddress = {
            full_name: customerName,
            street1: addr?.line1 ?? (session.metadata?.ship_to_street || ""),
            street2: addr?.line2 || null,
            city: addr?.city ?? (session.metadata?.ship_to_city || ""),
            state: addr?.state ?? (session.metadata?.ship_to_state || ""),
            zip_code: addr?.postal_code ?? (session.metadata?.ship_to_zip || ""),
            country: addr?.country ?? (session.metadata?.ship_to_country || ""),
            phone: session.metadata?.ship_to_phone || "",
            email: email,
        };

        console.log("[orders] Attempting DB insert for session:", session.id);
        const { data: order, error: orderError } = await (supabase as any)
            .from("orders")
            .insert({
                stripe_session_id: session.id,
                stripe_payment_intent:
                    typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : null,
                customer_email: email,
                customer_name: customerName,
                status: "paid",
                subtotal_pence: subtotalPence,
                shipping_pence: shippingPence,
                total_pence: totalPence,
                packlink_service_id: session.metadata?.shipping_service_id ?? null,
                shipping_service_name: session.metadata?.shipping_service_name ?? null,
                shipping_address: shippingAddress,
                user_id: session.metadata?.user_id || null,
            })
            .select("id")
            .single();

        if (orderError || !order) {
            console.error("[orders] Failed to insert order:", orderError);
            throw new Error(`DB insert failed: ${orderError?.message}`);
        }

        orderId = (order as any).id;
        console.log("[orders] Order persisted:", orderId);

        // ── Increment Coupon Usage ────────────────────────────────────────────────
        if (session.metadata?.coupon_id) {
            await supabase.rpc('increment_coupon_usage', { coupon_id: session.metadata.coupon_id });
        }

        // Record line items
        for (const item of lineItems) {
            const product = item.price?.product as Stripe.Product | undefined;
            const productId = product?.metadata?.product_id;
            if (!productId) continue;

            await supabase.from("order_items").insert({
                order_id: orderId,
                product_id: productId,
                product_name: item.description ?? "",
                product_price_pence: item.price?.unit_amount || 0,
                quantity: item.quantity ?? 1,
            } as any);
        }
    }

    // 5. Send/Resend Confirmation Email
    if (orderId) {
        await triggerOrderEmail(session, orderId, customerName, totalPence, lineItems);
    }

    return { orderId, alreadyProcessed };
}

async function triggerOrderEmail(
    session: Stripe.Checkout.Session,
    orderId: string,
    customerName: string,
    totalPence: number,
    lineItems: any[]
) {
    try {
        // Collect all potential recipients
        const recipients = [
            session.customer_details?.email,
            session.customer_email,
            session.metadata?.user_email
        ]
        .filter((email): email is string => !!email && typeof email === 'string' && email.length > 0);

        // Deduplicate
        const uniqueRecipients = [...new Set(recipients)];

        if (uniqueRecipients.length === 0) {
            console.warn("[orders] No recipients found for order:", orderId);
            return;
        }

        await sendOrderConfirmationEmail({
            to: uniqueRecipients,
            orderId: orderId.slice(0, 8),
            customerName,
            total: formatPrice(totalPence),
            items: lineItems
                .map((item: any) => ({
                    name: item.description || "Unknown item",
                    quantity: item.quantity || 1,
                    isProduct: !!(item.price?.product as any)?.metadata?.product_id,
                }))
                .filter((i: any) => i.isProduct),
        });
        console.log("[orders] Email(s) triggered for order:", orderId, "to:", uniqueRecipients.join(", "));
    } catch (err) {
        console.error("[orders] Email failed:", err);
    }
}
