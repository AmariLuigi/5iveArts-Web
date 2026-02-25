import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
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
        await handleCheckoutCompleted(session);
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

// ---------------------------------------------------------------------------
// Business logic helpers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log("[webhook] checkout.session.completed:", session.id);

  const supabase = getSupabaseAdmin();

  // ── Guard: skip if this session was already processed (idempotency) ────────
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) {
    console.log("[webhook] Order already recorded for session:", session.id);
    return;
  }

  // ── Retrieve full session with line items ──────────────────────────────────
  const fullSession = await getStripe().checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
  });

  const lineItems = fullSession.line_items?.data ?? [];
  const shippingDetails = fullSession.shipping_details;
  const customerName =
    shippingDetails?.name ?? session.metadata?.ship_to_name ?? "Unknown";

  // ── Calculate totals from Stripe amounts ──────────────────────────────────
  const totalPence = fullSession.amount_total ?? 0;
  // Stripe stores shipping separately only when collected via shipping_address_collection.
  // We passed shipping as a line item, so amount_shipping may be 0 — use metadata instead.
  const shippingPence = fullSession.shipping_cost?.amount_total ?? 0;
  const subtotalPence = totalPence - shippingPence;

  // ── Build shipping address from Stripe's collected details ────────────────
  const addr = shippingDetails?.address;
  const shippingAddress = {
    full_name: customerName,
    street1: addr?.line1 ?? session.metadata?.ship_to_name ?? "",
    street2: addr?.line2 ?? undefined,
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    zip_code: addr?.postal_code ?? session.metadata?.ship_to_zip ?? "",
    country: addr?.country ?? session.metadata?.ship_to_country ?? "",
    phone: "",
    email: session.customer_email ?? "",
  };

  // ── Insert order row ───────────────────────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      customer_email: session.customer_email ?? "",
      customer_name: customerName,
      status: "paid",
      subtotal_pence: subtotalPence,
      shipping_pence: shippingPence,
      total_pence: totalPence,
      packlink_service_id: session.metadata?.packlink_service_id ?? null,
      shipping_address: shippingAddress,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[webhook] Failed to insert order:", orderError);
    throw new Error(`DB insert failed: ${orderError?.message}`);
  }

  console.log("[webhook] Order persisted:", order.id);

  // ── Insert order items + decrement stock ───────────────────────────────────
  // Line items from Stripe include both product lines and the shipping line item.
  // We identify product lines by the presence of product metadata.
  for (const item of lineItems) {
    const productId = (item.price?.product_data as Record<string, unknown> | undefined)
      ?.metadata
      ? ((item.price?.product_data as Record<string, unknown>).metadata as Record<string, string>)
          ?.product_id
      : null;

    if (!productId) continue; // Skip the shipping line item

    const qty = item.quantity ?? 1;

    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: productId,
      product_name: item.description ?? "",
      product_price_pence: item.price?.unit_amount ?? 0,
      quantity: qty,
    });

    // Atomically decrement stock via the DB function
    const { error: stockError } = await supabase.rpc("decrement_stock", {
      p_product_id: productId,
      p_qty: qty,
    });
    if (stockError) {
      console.error(
        `[webhook] Failed to decrement stock for ${productId}:`,
        stockError
      );
    }
  }

  // TODO (Upgrade #5): Call createShipment() from @/lib/packlink to create the
  // shipping label and update the order row with packlink_shipment_id,
  // tracking_number, and label_url.

  // TODO (Upgrade #2): Send order confirmation email via Resend.

  console.log(
    `[webhook] Order ${order.id} fully recorded. Ship via Packlink service "${session.metadata?.packlink_service_id}" for ${session.customer_email}`
  );
}
