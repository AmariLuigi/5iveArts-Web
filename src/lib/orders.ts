import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail, sendOrderStageUpdateEmail } from "@/lib/email";
import { formatPrice } from "@/lib/products";
import Stripe from "stripe";

export async function processCompletedCheckout(
    session: Stripe.Checkout.Session,
    forceEmail: boolean = false
): Promise<{ orderId: string; alreadyProcessed: boolean }> {
    console.log("[orders] processing session:", session.id, forceEmail ? "(force email)" : "");

    const supabase = getSupabaseAdmin() as any;

    // 1. Check if order exists (by Stripe Session ID)
    const { data: existingBySession } = await supabase
        .from("orders")
        .select("id, status, is_custom")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

    // 2. Check if this is an installment for an EXISTING custom order
    const existingOrderId = session.metadata?.order_id;
    let orderToUpdate = null;

    if (existingOrderId && !existingBySession) {
        const { data: order } = await supabase
            .from("orders")
            .select("*")
            .eq("id", existingOrderId)
            .maybeSingle();
        orderToUpdate = order;
    }

    const alreadyProcessedBySession = !!existingBySession;
    let orderId = existingBySession?.id || (orderToUpdate?.id);

    // 3. If it exists by session and we DON'T need to force an email, we can exit early
    if (alreadyProcessedBySession && !forceEmail) {
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

    // 4. Record the order if it doesn't exist yet OR update existing if it's an installment
    if (!alreadyProcessedBySession) {
        const shippingPence = 
            parseInt(session.metadata?.shipping_pence || "0", 10) || 
            fullSession.shipping_cost?.amount_total || 0;
            
        const subtotalPence = totalPence - shippingPence;
        const addr = shippingDetails?.address;
        const email = session.customer_details?.email ?? session.customer_email ?? session.metadata?.email ?? "";

        const paymentType = session.metadata?.payment_type || "full";
        const isCustom = session.metadata?.is_custom === "true" || !!orderToUpdate?.is_custom;
        const status = paymentType === "deposit" ? "in_production" : "paid";

        if (orderToUpdate) {
            // Installment update for existing custom order
            console.log("[orders] Updating existing order installment:", orderId, "Stage:", paymentType);
            const updateData: any = {
                status,
                stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : null,
            };

            if (paymentType === "deposit") {
                updateData.deposit_pence = totalPence;
            } else if (paymentType === "final") {
                updateData.final_payment_pence = totalPence;
                updateData.shipping_pence = shippingPence; // Usually final payment includes shipping
                updateData.total_pence = (orderToUpdate.deposit_pence || 0) + totalPence;
            }

            await supabase
                .from("orders")
                .update(updateData)
                .eq("id", orderId);

            // Send stage update email for installments
            if (isCustom) {
                await sendOrderStageUpdateEmail({
                    to: email,
                    orderId: orderId,
                    customerName: customerName,
                    stage: paymentType === 'deposit' ? 'forging' : 'shipped', // 'shipped' here implies deployment prep started
                });
            }

        } else {
            // Fresh checkout order
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
                    status,
                    subtotal_pence: subtotalPence,
                    shipping_pence: shippingPence,
                    total_pence: totalPence,
                    carrier_service_id: session.metadata?.shipping_service_id ?? null,
                    shipping_service_name: session.metadata?.shipping_service_name ?? null,
                    shipping_address: shippingAddress,
                    user_id: session.metadata?.user_id || null,
                    is_custom: isCustom,
                    scale: session.metadata?.scale || null,
                    complexity_factor: parseFloat(session.metadata?.complexity_factor || "1.0"),
                    deposit_pence: paymentType === "deposit" || paymentType === "full" ? totalPence : 0,
                    final_payment_pence: paymentType === "final" || paymentType === "full" ? totalPence : 0,
                    referrer_id: session.metadata?.referrer_id || null,
                })
                .select("id")
                .single();

            if (orderError || !order) {
                console.error("[orders] Failed to insert order:", orderError);
                throw new Error(`DB insert failed: ${orderError?.message}`);
            }

            orderId = (order as any).id;
            console.log("[orders] Order persisted:", orderId);

            // ── Inventory Race-Condition Mitigation (The 'Audit' Standard) ─────────
            // We use an atomic RPC function in Supabase to decrement stock.
            // This prevents "double-selling" if two webhooks fire near-simultaneously.
            for (const item of lineItems) {
                const product = item.price?.product as Stripe.Product | undefined;
                const productId = product?.metadata?.product_id;
                const quantity = item.quantity ?? 1;
                
                if (productId) {
                    const { error: stockError } = await supabase.rpc("decrement_stock", {
                        row_id: productId,
                        decrement_by: quantity
                    });
                    
                    if (stockError) {
                        console.error(`[orders-inventory] Stock decrement failed for ${productId}:`, stockError);
                        // We continue with the order because the payment is already captured, 
                        // but we log a critical alert for manual warehouse reconciliation.
                    }
                }
            }

            // Record line items (only for NEW orders, installments are linked to existing items)
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
    }

    // 5. Send/Resend Confirmation Email
    if (orderId) {
        await triggerOrderEmail(session, orderId, customerName, totalPence, lineItems);
        
        // 6. Handle Professional Referral Commission
        if (session.metadata?.referrer_id && !alreadyProcessedBySession) {
            await applyCommission(orderId, session);
        }
    }

    return { orderId, alreadyProcessed: alreadyProcessedBySession };
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

async function applyCommission(orderId: string, session: Stripe.Checkout.Session) {
    const referrerId = session.metadata?.referrer_id;
    const customerIp = session.metadata?.customer_ip;
    const subtotalPence = (session.amount_total || 0) - (parseInt(session.metadata?.shipping_pence || "0", 10) || 0);

    if (!referrerId || subtotalPence <= 0) return;

    try {
        const supabase = getSupabaseAdmin();

        // 1. Fetch Referrer Profile for security checks
        const { data: partner, error: pError } = await (supabase as any)
            .from("profiles")
            .select("id, email, commission_rate")
            .eq("id", referrerId)
            .single();

        if (pError || !partner) {
            console.error("[commission] Referrer not found:", referrerId);
            return;
        }

        // 2. SECURITY Check: Self-Referral Prevention (Email & Identity)
        const customerEmail = session.customer_details?.email?.toLowerCase();
        const partnerEmail = partner.email?.toLowerCase();
        const userId = session.metadata?.user_id;

        if (customerEmail === partnerEmail || userId === partner.id) {
            console.warn(`[commission-fraud] Self-referral detected for order ${orderId}. Skipping.`);
            return;
        }

        // 3. SECURITY Check: IP Fraud detection
        // Check if the current checkout IP matches the Referrer's profile or previous clicks
        if (customerIp) {
            const { data: suspectClicks } = await (supabase as any)
                .from("referral_clicks")
                .select("id")
                .eq("referrer_id", partner.id)
                .eq("ip_address", customerIp)
                .limit(1);

            if (suspectClicks && suspectClicks.length > 0) {
                 // Wait: This logic is tricky. A referrer MIGHT show the site on their phone to a friend.
                 // But the user asked for strictness. "YES for sure, same IP already used by referrer".
                 console.warn(`[commission-fraud] IP Collision detected (${customerIp}). Blocked.`);
                 return;
            }
        }

        // 4. Calculate Commission (using partners stored rate)
        const rate = partner.commission_rate || 10;
        const commissionAmount = Math.floor(subtotalPence * (rate / 100));

        // 5. Insert Commission Record
        await (supabase as any).from("commissions").insert({
            order_id: orderId,
            referrer_id: partner.id,
            amount_pence: commissionAmount,
            rate_applied: rate,
            customer_ip_at_purchase: customerIp,
            status: 'pending'
        });

        // 6. UPDATE Profile Pending Balance
        await (supabase as any).rpc('increment_pending_commission', {
            profile_id: partner.id,
            amount: commissionAmount
        });

        console.log(`[commission] Recorded ${commissionAmount}p for partner ${partner.id} on order ${orderId}`);

    } catch (err) {
        console.error("[commission] Failure:", err);
    }
}
