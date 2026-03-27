import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('archived') === 'true';

    let query = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (!includeArchived) {
        query = query.neq("status", "archived");
    }

    const { data, error } = await query;

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
        name_en: body.name_en, name_it: body.name_it, name_de: body.name_de, name_fr: body.name_fr, name_es: body.name_es,
        name_ru: body.name_ru, name_tr: body.name_tr, name_pt: body.name_pt, name_nl: body.name_nl, name_ja: body.name_ja, name_ar: body.name_ar, name_pl: body.name_pl,
        description: body.description,
        description_en: body.description_en, description_it: body.description_it, description_de: body.description_de, description_fr: body.description_fr, description_es: body.description_es,
        description_ru: body.description_ru, description_tr: body.description_tr, description_pt: body.description_pt, description_nl: body.description_nl, description_ja: body.description_ja, description_ar: body.description_ar, description_pl: body.description_pl,
        price: body.price,
        images: Array.isArray(body.images) ? body.images : [],
        videos: Array.isArray(body.videos) ? body.videos : [],
        category: body.category,
        franchise: body.franchise,
        subcategory: body.subcategory,
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
