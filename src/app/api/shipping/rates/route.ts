import { NextRequest, NextResponse } from "next/server";
import { getShippingRates } from "@/lib/shipping";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateShippingAddress, sanitizeNumber } from "@/lib/validate";

// Rate limit: 20 rate-lookup requests per IP per minute
const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
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

  const subtotalPence = sanitizeNumber(b.subtotalPence, 0, 1_000_000) ?? 0;

  // ── Return flat-rate shipping options ──────────────────────────────────────
  const rates = getShippingRates(addressResult.data, subtotalPence);
  return NextResponse.json(rates);
}
