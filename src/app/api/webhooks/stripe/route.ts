import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { processCompletedCheckout } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

/**
 * Stripe webhook handler.
 *
 * Security: every incoming request is verified against the Stripe webhook
 * signing secret before any business logic runs. This prevents spoofed events.
 */

/** Server-side analytics insertion — bypasses client session restrictions */
async function trackServerEvent(
  eventType: string,
  eventData: Record<string, unknown>,
  sessionId?: string | null
) {
  try {
    const supabase = getSupabaseAdmin();
    await (supabase.from("analytics_events") as any).insert({
      event_type: eventType,
      event_data: eventData,
      session_id: sessionId || "stripe-webhook",
      user_id: null,
    });
  } catch (err) {
    // Never block webhook processing for telemetry failures
    console.error("[webhook-analytics] Failed to insert event:", eventType, err);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // ── Read raw body (required for signature verification) ───────────────────
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // ── Verify signature ───────────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // ── Handle events ──────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { orderId } = await processCompletedCheckout(session);

        // ── Track checkout_complete (server-side = 100% reliable) ─────────
        const shippingPence = parseInt(session.metadata?.shipping_pence || "0", 10) || 0;
        const totalPence = session.amount_total ?? 0;
        const country = ((session as any).shipping_details?.address?.country ?? session.metadata?.ship_to_country) || null;

        // Check if this is a repeat customer (prior paid orders by same email)
        let isRepeatCustomer = false;
        try {
          const supabase = getSupabaseAdmin();
          const email = session.customer_details?.email ?? session.metadata?.email;
          if (email) {
            const { count } = await (supabase as any)
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("customer_email", email)
              .eq("status", "paid")
              .neq("id", orderId); // exclude the current order
            isRepeatCustomer = (count ?? 0) > 0;
          }
        } catch { /* non-critical */ }

        await trackServerEvent("checkout_complete", {
          order_id: orderId,
          total_pence: totalPence,
          subtotal_pence: totalPence - shippingPence,
          shipping_pence: shippingPence,
          shipping_service: session.metadata?.shipping_service_name ?? null,
          courier_id: session.metadata?.shipping_service_id ?? null,
          payment_method: session.payment_method_types?.[0] ?? null,
          country,
          user_id: session.metadata?.user_id || null,
          is_repeat_customer: isRepeatCustomer,
          coupon_used: !!session.metadata?.coupon_id,
          stripe_session_id: session.id,
        }, session.metadata?.analytics_session_id ?? null);

        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.warn("[webhook] Payment failed for PaymentIntent:", intent.id);

        // ── Track payment_failed (previously only a console.warn) ─────────
        const lastError = intent.last_payment_error;
        await trackServerEvent("payment_failed", {
          payment_intent_id: intent.id,
          failure_code: lastError?.code ?? null,
          failure_message: lastError?.message ?? null,
          decline_code: lastError?.decline_code ?? null,
          payment_method: lastError?.payment_method?.type ?? null,
          amount_pence: intent.amount,
          currency: intent.currency,
          // Attempt number inferred from metadata
          attempt_number: (intent as any).charges?.data?.length ?? 1,
        }, null);

        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.error("[webhook-security] DISPUTE CREATED:", dispute.id, "for intent:", dispute.payment_intent);
        
        const supabase = getSupabaseAdmin() as any;
        // Mark order as disputed to freeze operations
        await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("stripe_payment_intent", dispute.payment_intent as string);

        await trackServerEvent("payment_dispute", {
          dispute_id: dispute.id,
          reason: dispute.reason,
          amount: dispute.amount,
          status: dispute.status,
          payment_intent: dispute.payment_intent
        }, null);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("[webhook] Charge refunded:", charge.id);
        
        const supabase = getSupabaseAdmin() as any;
        const { data: order } = await supabase
          .from("orders")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent", charge.payment_intent as string)
          .select("id")
          .maybeSingle();

        if (order) {
            // Automatically void any associated commissions
            await supabase
                .from("commissions")
                .update({ status: "voided" })
                .eq("order_id", order.id);

            console.log(`[webhook] Voided commissions for order: ${order.id}`);
        }

        await trackServerEvent("payment_refund", {
          charge_id: charge.id,
          amount_refunded: charge.amount_refunded,
          payment_intent: charge.payment_intent
        }, null);
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // MONITORING: Dead-Letter Queue — Return 500 so Stripe retries the event
    return NextResponse.json(
      { error: "Internal webhook handler error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
