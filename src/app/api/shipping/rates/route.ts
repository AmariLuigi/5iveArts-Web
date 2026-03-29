import { NextRequest, NextResponse } from "next/server";
import { fetchShippingRates } from "@/lib/paccofacile";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateShippingAddress, sanitizeNumber } from "@/lib/validate";
import { getSiteSettings } from "@/lib/settings";

// Rate limit: 60 rate-lookup requests per IP per minute
const RATE_LIMIT = { limit: 60, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`shipping-rates:${ip}`, RATE_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const addressResult = validateShippingAddress(b.toAddress);
  if (addressResult.error || !addressResult.data) {
    return NextResponse.json({ error: addressResult.error }, { status: 400 });
  }

  const subtotalPence = sanitizeNumber(b.subtotalPence, 0, 1_000_000) ?? 0;

  // ── Fetch dynamic Paccofacile rates ──────────────────────────────────────
  const settings = await getSiteSettings();
  const rates = await fetchShippingRates(addressResult.data, subtotalPence, settings.logistics, (b.items as any[]) || []);

  if (rates.length === 0) {
    console.warn(`[shipping] No Paccofacile services found for ${addressResult.data.country}/${addressResult.data.zip_code}.`);
    return NextResponse.json(
      { error: "No shipping services available for this destination. Please verify your address." },
      { status: 404 }
    );
  }

  console.log(`[shipping] Paccofacile returned ${rates.length} services for ${addressResult.data.country}/${addressResult.data.zip_code}.`);
  return NextResponse.json(rates);
}
