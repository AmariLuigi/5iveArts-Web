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
    return NextResponse.json({ error: itemsResult.error }, { status: 400 });
  }

  const addressResult = validateShippingAddress(b.shippingAddress);
  if (addressResult.error || !addressResult.data) {
    return NextResponse.json({ error: addressResult.error }, { status: 400 });
  }

  // Validate shipping rate (structure only — price is set server-side in metadata)
  const rawRate = b.shippingRate as ShippingRate | undefined;
  if (!rawRate?.service_id || typeof rawRate.price !== "number") {
    return NextResponse.json(
      { error: "A valid shippingRate is required" },
      { status: 400 }
    );
  }

  const items = itemsResult.data;
  const address = addressResult.data;

  // ── Build Stripe line items (prices come from the server catalogue) ────────
  const productLineItems = items.map((item) => ({
    price_data: {
      currency: "gbp",
      unit_amount: item.product.price, // trusted server value
      product_data: {
        name: item.product.name,
        description: item.product.description.slice(0, 200),
        metadata: { product_id: item.product.id },
      },
    },
    quantity: item.quantity,
  }));

  // Shipping as a separate line item (no custom metadata needed)
  const shippingLineItem = {
    price_data: {
      currency: "gbp",
      unit_amount: rawRate.price,
      product_data: {
        name: `Shipping: ${rawRate.carrier_name} — ${rawRate.service_name}`,
        description: `Est. ${rawRate.estimated_days} day(s)`,
      },
    },
    quantity: 1,
  };

  const lineItems = [...productLineItems, shippingLineItem];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: address.email,
      shipping_address_collection: {
        allowed_countries: ["GB", "IE", "FR", "DE", "ES", "IT", "NL", "BE", "PT"],
      },
      metadata: {
        packlink_service_id: rawRate.service_id,
        ship_to_name: address.full_name,
        ship_to_zip: address.zip_code,
        ship_to_country: address.country,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Could not create checkout session. Please try again." },
      { status: 502 }
    );
  }
}
