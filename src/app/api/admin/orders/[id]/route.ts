import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("id", id)
        .single();

    if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 404 });
    }

    return NextResponse.json(order);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await req.json();

    // Allow updating status, tracking_number, and label_url
    const { status, tracking_number, label_url } = body;

    const { data, error } = await supabase
        .from("orders")
        .update({
            status,
            tracking_number,
            label_url,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
}
