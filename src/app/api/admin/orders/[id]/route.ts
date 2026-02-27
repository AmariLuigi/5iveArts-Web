import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
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
        console.error("[api/admin/orders] GET error:", orderError.message);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 404 });
    }

    return NextResponse.json(order);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
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
        console.error("[api/admin/orders] PATCH error:", error.message);
        return NextResponse.json({ error: "Failed to update order" }, { status: 400 });
    }

    return NextResponse.json(data);
}
