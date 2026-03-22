import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Analytics tracking rate limit: 100 events per IP per minute
// This is more generous than rates because tracking fires frequently (steps, cart, etc.)
const RATE_LIMIT = { limit: 100, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`analytics-track:${ip}`, RATE_LIMIT);
  
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many analytics events. Please slow down." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { event_type, event_data, session_id, user_id } = body;

  if (!event_type || !session_id) {
    return NextResponse.json(
      { error: "Missing required fields: event_type and session_id" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    const { error } = await (supabase.from("analytics_events") as any)
      .insert({
        event_type,
        event_data: event_data || {},
        session_id,
        user_id: user_id || null,
      });

    if (error) {
      console.error("[analytics] Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to store event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[analytics] Internal tracking error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
