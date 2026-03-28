import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { service_id } = await req.json();

    if (!service_id) {
        return NextResponse.json({ error: "Missing service_id" }, { status: 400 });
    }
    
    // 1. Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch order to verify ownership and status
    const { data: order, error: orderError } = await (supabase as any)
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Verify status (only allowed during quoted phase for custom orders)
    if (order.status !== 'quoted' && order.status !== 'analyzing') {
       return NextResponse.json({ error: "Protocol locked. Logistics cannot be updated at this phase." }, { status: 400 });
    }

    // 4. Find the matching option in the order's snapshot
    const options = order.shipping_options || [];
    const matched = options.find((opt: any) => String(opt.service_id) === String(service_id));

    if (!matched) {
        return NextResponse.json({ error: "Invalid logistics service ID" }, { status: 400 });
    }

    // 5. Update the order with the selected shipment details
    const admin = getSupabaseAdmin();
    const subtotal = order.subtotal_pence || 0;
    const shipping = Math.round(matched.price);

    const { error: updateError } = await (admin as any)
      .from("orders")
      .update({ 
          carrier_service_id: matched.service_id,
          shipping_service_name: `${matched.carrier_name} — ${matched.service_name}`,
          shipping_pence: shipping,
          total_pence: subtotal + shipping,
          updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
        success: true, 
        carrier_service_id: matched.service_id,
        shipping_service_name: `${matched.carrier_name} — ${matched.service_name}`,
        shipping_pence: shipping
    });

  } catch (err: any) {
    console.error("[PATCH /api/orders/[id]/logistics] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
