import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Get authenticated user from server session (anon client)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch order to verify ownership (user-owned order only)
    const { data: order, error: orderError } = await (supabase as any)
      .from("orders")
      .select("id, user_id, status")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Verify status is eligible for delivery confirmation
    if (order.status !== 'shipped' && order.status !== 'ready_to_ship' && order.status !== 'delivered') {
       return NextResponse.json({ error: "Order is not in a deliverable state" }, { status: 400 });
    }

    // 4. Update status to delivered using Admin client (bypass RLS for internal state sync)
    const admin = getSupabaseAdmin();
    const { error: updateError } = await (admin as any)
      .from("orders")
      .update({ 
          status: 'delivered',
          updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, status: 'delivered' });
  } catch (err: any) {
    console.error("[PATCH /api/orders/[id]/deliver] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
