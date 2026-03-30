import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateCartItems, validateShippingAddress } from "@/lib/validate";
import { ShippingRate } from "@/types";
import { writeToPersistentLog } from "@/lib/logger";
import { createClient } from "@/lib/supabase-server";

// Rate limit: 10 checkout attempts per IP per minute
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString();
  const msg = `/api/checkout called at ${timestamp}`;
  console.log(`[API-DEBUG] ${msg}`);
  writeToPersistentLog(msg);
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

  const itemsResult = await validateCartItems(b.items);
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
  const { fetchShippingRates } = await import("@/lib/paccofacile");
  const { getSiteSettings } = await import("@/lib/settings");

  const subtotalCents = items.reduce(
    (acc, item) => acc + item.priceAtSelection * item.quantity,
    0
  );

  const settings = await getSiteSettings();

  // We must re-fetch/calculate the rates server-side to prevent price tampering
  const serverRates = await fetchShippingRates(address, subtotalCents, settings.logistics);

  const matchedRate = serverRates.find((r) => r.service_id === rawRate.service_id);

  if (!matchedRate) {
    console.warn("[api/checkout] Invalid shipping service_id:", rawRate.service_id, "Target Address:", address.country, address.zip_code);
    return NextResponse.json(
      { error: "Invalid shipping service selected or unavailable for this address." },
      { status: 400 }
    );
  }

  // Use the server-authoritative price, ignoring the client-supplied rawRate.price
  const shippingPrice = matchedRate.price;

  const isCustom = b.isCustom === true;
  const paymentType = isCustom ? "deposit" : "full";
  // Extract locale for return_url (prevents proxy redirect that can drop session_id)
  const lang = typeof b.lang === "string" && b.lang.length <= 5 ? b.lang : "en";

  // ── Build Stripe line items (prices come from the server validated items) ──
  const productLineItems = items.map((item) => {
    let unitAmount = item.priceAtSelection;
    if (isCustom) {
      unitAmount = Math.round(unitAmount * 0.5);
    }

    return {
      price_data: {
        currency: "eur",
        unit_amount: unitAmount,
        product_data: {
          name: `${item.product.name} (${item.selectedScale} / ${item.selectedFinish})${isCustom ? " [Deposit 50%]" : ""}`,
          description: item.product.description.slice(0, 200),
          metadata: {
            product_id: item.product.id,
            scale: item.selectedScale,
            finish: item.selectedFinish,
            is_custom: String(isCustom),
          },
        },
      },
      quantity: item.quantity,
    };
  });

  // Shipping as a separate line item (using validated server price)
  // Only include shipping if NOT a custom deposit (paid at the end for custom)
  const lineItems = [...productLineItems];
  if (!isCustom) {
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: shippingPrice,
        product_data: {
          name: `Shipping: ${matchedRate.carrier_name} — ${matchedRate.service_name}`,
          description: `Est. ${matchedRate.estimated_days} day(s)`,
        },
      },
      quantity: 1,
    } as any);
  }

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.5ivearts.com";
  // ── Create Stripe Checkout Session with embedded UI ───────────────────────
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // SECURITY: Using Idempotency Key to prevent duplicate requests from network jitter
    const idempotencyKey = `session_${address.email}_${Date.now().toString().slice(0, -3)}`;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      ui_mode: "custom",
      line_items: lineItems,
      customer_email: address.email,
      metadata: {
        shipping_service_id: isCustom ? "" : rawRate.service_id,
        shipping_service_name: isCustom ? "TBD (Paid on delivery)" : `${matchedRate.carrier_name} — ${matchedRate.service_name}`,
        shipping_pence: isCustom ? "0" : String(shippingPrice),
        ship_to_name: address.full_name,
        ship_to_street: address.street1,
        ship_to_city: address.city,
        ship_to_state: address.state || "",
        ship_to_zip: address.zip_code,
        ship_to_country: address.country,
        ship_to_phone: address.phone,
        user_id: user?.id || "",
        user_email: user?.email || "",
        is_custom: String(isCustom),
        payment_type: paymentType,
        scale: items[0]?.selectedScale || "",
        complexity_factor: String(items[0]?.product.complexityFactor || "1.0"),
        tos_accepted: "true",
        legal_version: "2026-03-30",
      },
      return_url: `${baseUrl}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    }, {
      idempotencyKey,
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

    let orderId: string | null = session.metadata?.order_id || null;
    let isCustom = session.metadata?.is_custom === "true";

    // ── Safe Reconciliation Fallback ──────────────────────────────────────────
    // If the session is complete/paid, ensure it's recorded in the database.
    // This acts as a fallback for when webhooks are slow OR missed (e.g. local dev).
    if (session.status === "complete" || session.payment_status === "paid") {
      const { processCompletedCheckout } = await import("@/lib/orders");
      try {
        const { orderId: reconciledId } = await processCompletedCheckout(session);
        orderId = reconciledId;
        console.log(`[api/checkout] Reconciled session: ${session.id} -> Order: ${orderId}`);
      } catch (err) {
        // Log but don't fail the status check; let the UI show "paid" but maybe without order ID
        console.error("[api/checkout] Reconciliation failed:", err);
      }
    }

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email ?? session.customer_email,
      orderId,
      isCustom,
      paymentType: session.metadata?.payment_type
    });
  } catch (err) {
    console.error("[checkout] session retrieve error:", err);
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
}
