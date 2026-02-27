import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { formatPrice } from "@/lib/products";
import Stripe from "stripe";

export async function processCompletedCheckout(
    session: Stripe.Checkout.Session
): Promise<{ orderId: string; alreadyProcessed: boolean }> {
    console.log("[orders] processing session:", session.id);

    const supabase = getSupabaseAdmin() as any;

    // ── Guard: skip if this session was already processed (idempotency) ────────
    const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

    if (existing) {
        console.log("[orders] Order already recorded for session:", session.id);
        return { orderId: existing.id, alreadyProcessed: true };
    }

    // ── Retrieve full session with line items ──────────────────────────────────
    const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "line_items.data.price.product"],
    });

    const lineItems = fullSession.line_items?.data ?? [];
    // @ts-ignore
    const shippingDetails = fullSession.shipping_details ?? (session as any).shipping_details;
    const customerName =
        shippingDetails?.name ?? session.metadata?.ship_to_name ?? "Unknown";

    // ── Calculate totals from Stripe amounts ──────────────────────────────────
    const totalPence = fullSession.amount_total ?? 0;
    const shippingPence = fullSession.shipping_cost?.amount_total ?? 0;
    const subtotalPence = totalPence - shippingPence;

    // ── Build shipping address from Stripe's collected details ────────────────
    const addr = shippingDetails?.address;
    const email = session.customer_details?.email ?? session.customer_email ?? session.metadata?.email ?? "";

    const shippingAddress = {
        full_name: customerName,
        street1: addr?.line1 ?? (session.metadata?.ship_to_street || ""),
        street2: addr?.line2 || null,
        city: addr?.city || "",
        state: addr?.state || "",
        zip_code: addr?.postal_code ?? (session.metadata?.ship_to_zip || ""),
        country: addr?.country ?? (session.metadata?.ship_to_country || ""),
        phone: session.metadata?.ship_to_phone || "",
        email: email,
    };

    // ── Insert order row ───────────────────────────────────────────────────────
    console.log("[orders] Attempting DB insert for session:", session.id);
    const { data: order, error: orderError } = await supabase
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
            shipping_address: shippingAddress,
        } as any)
        .select("id")
        .single();

    if (orderError || !order) {
        console.error("[orders] Failed to insert order:", orderError);
        throw new Error(`DB insert failed: ${orderError?.message}`);
    }

    const orderId = (order as any).id;
    console.log("[orders] Order persisted:", orderId);

    // ── Insert order items ─────────────────────────────────────────────────────
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

    // ── Send Confirmation Email ───────────────────────────────────────────────
    await triggerOrderEmail(session, orderId, customerName, totalPence, lineItems);

    return { orderId, alreadyProcessed: false };
}

export async function triggerOrderEmail(
    session: Stripe.Checkout.Session,
    orderId: string,
    customerName: string,
    totalPence: number,
    lineItems: any[]
) {
    try {
        await sendOrderConfirmationEmail({
            to: session.customer_email || "",
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
        console.log("[orders] Email triggered for order:", orderId);
    } catch (err) {
        console.error("[orders] Email failed:", err);
    }
}
