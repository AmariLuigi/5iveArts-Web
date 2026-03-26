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
        .neq("status", "archived")
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

    // Explicitly allowlist only valid product columns to prevent mass-assignment
    const safePayload = {
        id: body.id,
        name: body.name,
        description: body.description,
        description_en: body.description_en,
        description_it: body.description_it,
        description_de: body.description_de,
        description_fr: body.description_fr,
        description_es: body.description_es,
        price: body.price,
        images: Array.isArray(body.images) ? body.images : [],
        videos: Array.isArray(body.videos) ? body.videos : [],
        category: body.category,
        status: body.status,
        tags: Array.isArray(body.tags) ? body.tags : [],
        details: Array.isArray(body.details) ? body.details : [],
    };

    const { data, error } = await supabase
        .from("products")
        .insert(safePayload)
        .select()
        .single();

    if (error) {
        console.error("[api/admin/products] POST error:", error.message);
        return NextResponse.json({ error: "Failed to create product" }, { status: 400 });
    }

    return NextResponse.json(data);
}
