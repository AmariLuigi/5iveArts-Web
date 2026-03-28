import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin() as any;
    const { id } = params;
    const { options } = await req.json();

    if (!Array.isArray(options)) {
      return NextResponse.json({ error: "Invalid options format" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        shipping_options: options,
        // If there's only one option, we can pre-select it or just wait for user
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PATCH /api/admin/orders/[id]/shipping-options] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
