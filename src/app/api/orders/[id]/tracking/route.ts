import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTrackingInfo } from "@/lib/tracking";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin() as any;

    // 1. Fetch Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, tracking_number, shipping_service_name, carrier_delivered")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.tracking_number) {
      return NextResponse.json({ error: "No tracking number assigned" }, { status: 400 });
    }

    // 2. Fetch Real-time Tracking
    const tracking = await getTrackingInfo(
      order.shipping_service_name || "Poste Italiane",
      order.tracking_number
    );

    if (!tracking) {
      return NextResponse.json({ error: "Tracking provider not found or failed" }, { status: 502 });
    }

    // 3. Update Flag if Delivered (but don't change order status automatically)
    if (tracking.status === "delivered" && !order.carrier_delivered) {
      await supabase
        .from("orders")
        .update({
          carrier_delivered: true,
          carrier_delivered_at: new Date().toISOString(),
          carrier_last_status: tracking.status
        })
        .eq("id", id);
    } else {
        // Update last status regardless for sync
        await supabase
        .from("orders")
        .update({
          carrier_last_status: tracking.status
        })
        .eq("id", id);
    }

    return NextResponse.json(tracking);
  } catch (err: any) {
    console.error("[api/orders/tracking] Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
