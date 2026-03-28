import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const { id } = await params;
    const body = await req.json();

    const { url, stage } = body;

    if (!url || !stage) {
        return NextResponse.json({ error: "Missing required fields: url or stage" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("order_progress_media")
        .insert({
            order_id: id,
            url,
            stage,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error("[api/admin/orders/progress] POST error:", error.message);
        return NextResponse.json({ error: "Failed to create progress record" }, { status: 400 });
    }

    return NextResponse.json(data);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const { id } = await params;

    const { data, error } = await supabase
        .from("order_progress_media")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[api/admin/orders/progress] GET error:", error.message);
        return NextResponse.json({ error: "Failed to fetch progress records" }, { status: 400 });
    }

    return NextResponse.json(data);
}
