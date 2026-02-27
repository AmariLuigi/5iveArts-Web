import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateCartItems, validateShippingAddress } from "@/lib/validate";
import { ShippingRate } from "@/types";

// Rate limit: 10 checkout attempts per IP per minute
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`checkout:${ip}`, RATE_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // ── Parse & validate body ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const itemsResult = validateCartItems(b.items);
  if (itemsResult.error || !itemsResult.data) {
    console.warn("[api/checkout] Items validation failed:", itemsResult.error);
    return NextResponse.json({ error: itemsResult.error || "Invalid items" }, { status: 400 });
  }

  const addressResult = validateShippingAddress(b.shippingAddress);
  if (addressResult.error || !addressResult.data) {
    console.warn("[api/checkout] Address validation failed:", addressResult.error);
    return NextResponse.json({ error: addressResult.error || "Invalid address" }, { status: 400 });
  }

  // Validate shipping rate
  const rawRate = b.shippingRate as ShippingRate | undefined;
  if (!rawRate?.service_id || typeof rawRate.price !== "number") {
    console.warn("[api/checkout] Shipping rate validation failed:", rawRate);
    return NextResponse.json(
      { error: "A valid shippingRate is required" },
      { status: 400 }
    );
  }

  const items = itemsResult.data;
  const address = addressResult.data;

  // ── Calculate server-authoritative shipping price ─────────────────────────
  const { getShippingRates } = await import("@/lib/shipping");
  const subtotalCents = items.reduce(
    (acc, item) => acc + item.priceAtSelection * item.quantity,
    0
  );
  const serverRates = getShippingRates(address, subtotalCents);
  const matchedRate = serverRates.find((r) => r.service_id === rawRate.service_id);

  if (!matchedRate) {
    console.warn("[api/checkout] Invalid shipping service_id:", rawRate.service_id);
    return NextResponse.json(
      { error: "Invalid shipping service selected" },
      { status: 400 }
    );
  }

  // Use the server-authoritative price, ignoring the client-supplied rawRate.price
  const shippingPrice = matchedRate.price;

  // ── Build Stripe line items (prices come from the server validated items) ──
  const productLineItems = items.map((item) => ({
    price_data: {
      currency: "eur",
      unit_amount: item.priceAtSelection,
      product_data: {
        name: `${item.product.name} (${item.selectedScale} / ${item.selectedFinish})`,
        description: item.product.description.slice(0, 200),
        metadata: {
          product_id: item.product.id,
          scale: item.selectedScale,
          finish: item.selectedFinish,
        },
      },
    },
    quantity: item.quantity,
  }));

  // Shipping as a separate line item (using validated server price)
  const shippingLineItem = {
    price_data: {
      currency: "eur",
      unit_amount: shippingPrice,
      product_data: {
        name: `Shipping: ${matchedRate.carrier_name} — ${matchedRate.service_name}`,
        description: `Est. ${matchedRate.estimated_days} day(s)`,
      },
    },
    quantity: 1,
  };

  const lineItems = [...productLineItems, shippingLineItem];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // ── Create Stripe Checkout Session with embedded UI ───────────────────────
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      ui_mode: "custom",
      line_items: lineItems,
      customer_email: address.email,
      metadata: {
        shipping_service_id: rawRate.service_id,
        ship_to_name: address.full_name,
        ship_to_street: address.street1,
        ship_to_city: address.city,
        ship_to_zip: address.zip_code,
        ship_to_country: address.country,
        ship_to_phone: address.phone,
      },
      return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Could not create checkout session. Please try again." },
      { status: 502 }
    );
  }
}

// ── Retrieve session status (for the return page) ─────────────────────────────
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email ?? session.customer_email,
    });
  } catch (err) {
    console.error("[checkout] session retrieve error:", err);
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
}
