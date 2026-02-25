import { NextRequest, NextResponse } from "next/server";
import { getShippingRates } from "@/lib/packlink";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateShippingAddress, sanitizeNumber } from "@/lib/validate";

// Rate limit: 20 rate-lookup requests per IP per minute
const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

// Our warehouse postcode (sender)
const FROM_ADDRESS = {
  zip_code: process.env.WAREHOUSE_POSTCODE ?? "SW1A 1AA",
  country: process.env.WAREHOUSE_COUNTRY ?? "GB",
};

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`packlink-rates:${ip}`, RATE_LIMIT);
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

  const addressResult = validateShippingAddress(b.toAddress);
  if (addressResult.error || !addressResult.data) {
    return NextResponse.json({ error: addressResult.error }, { status: 400 });
  }

  const weightKg = sanitizeNumber(b.weightKg, 0.1, 30);
  if (weightKg === null) {
    return NextResponse.json(
      { error: "weightKg must be a number between 0.1 and 30" },
      { status: 400 }
    );
  }

  // ── Fetch rates from Packlink ──────────────────────────────────────────────
  try {
    const rates = await getShippingRates(
      FROM_ADDRESS,
      addressResult.data,
      weightKg
    );
    return NextResponse.json(rates);
  } catch (err) {
    console.error("[packlink/rates] error:", err);
    return NextResponse.json(
      { error: "Could not fetch shipping rates. Please try again." },
      { status: 502 }
    );
  }
}
