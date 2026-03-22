import { NextRequest, NextResponse } from "next/server";
import { writeToPersistentLog } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Rate limit: 10 log messages per IP per minute
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`debug-log:${ip}`, RATE_LIMIT);

  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many log events. Please wait a moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    let { message, type = "info" } = await req.json();
    
    // Sanitize to prevent massive payload DOS on the filesystem
    message = String(message || "").substring(0, 1000);
    const safeType = ["info", "warn", "error"].includes(type) ? type as "info" | "warn" | "error" : "info";
    
    // Use the central logger utility
    writeToPersistentLog(message, safeType);

    // Also keep the console log with the specific CLIENT prefix for visibility
    console.log(`[CLIENT-TRACE] [${safeType.toUpperCase()}] ${message}`);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
