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

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("[api/admin/products] GET detail error:", error.message);
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(data);
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

    const { data, error } = await supabase
        .from("products")
        .update(body)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("[api/admin/products] PATCH detail error:", error.message);
        return NextResponse.json({ error: "Failed to update product" }, { status: 400 });
    }

    return NextResponse.json(data);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const { id } = await params;

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[api/admin/products] DELETE detail error:", error.message);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
