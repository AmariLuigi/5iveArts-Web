import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { processCompletedCheckout } from "@/lib/orders";
import Stripe from "stripe";

/**
 * Stripe webhook handler.
 *
 * Security: every incoming request is verified against the Stripe webhook
 * signing secret before any business logic runs. This prevents spoofed events.
 *
 * To configure:
 *  1. Set STRIPE_WEBHOOK_SECRET in your environment (from `stripe listen` or
 *     the Stripe Dashboard → Webhooks → Signing secret).
 *  2. Make sure this route receives the raw, unparsed request body (Next.js App
 *     Router does this by default when you call `req.text()`).
 */

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
        await processCompletedCheckout(session);
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.warn("[webhook] Payment failed for PaymentIntent:", intent.id);
        break;
      }
      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // Return 500 so Stripe retries the event
    return NextResponse.json(
      { error: "Internal webhook handler error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
