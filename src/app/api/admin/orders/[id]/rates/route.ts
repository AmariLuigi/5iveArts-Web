import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { fetchShippingRates } from "@/lib/paccofacile";
import { getSiteSettings } from "@/lib/settings";
import { ShippingAddress } from "@/types";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin() as any;
    const { id } = params;

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.shipping_address) {
      return NextResponse.json({ error: "No shipping address in order" }, { status: 400 });
    }

    const settings = await getSiteSettings();
    const subtotal = order.subtotal_pence || 10000;
    
    // Recalculate rates
    const options = await fetchShippingRates(order.shipping_address as ShippingAddress, subtotal, settings.logistics);

    if (options.length === 0) {
        return NextResponse.json({ error: "No tiers found for destination." }, { status: 502 });
    }

    return NextResponse.json({ options });
  } catch (err: any) {
    console.error("[POST /api/admin/orders/[id]/rates] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
