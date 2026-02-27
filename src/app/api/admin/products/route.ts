import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[api/admin/products] GET error:", error.message);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 400 });
    }

    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const body = await req.json();

    const { data, error } = await supabase
        .from("products")
        .insert(body)
        .select()
        .single();

    if (error) {
        console.error("[api/admin/products] POST error:", error.message);
        return NextResponse.json({ error: "Failed to create product" }, { status: 400 });
    }

    return NextResponse.json(data);
}
