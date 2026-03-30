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
    const body = await req.json() as Record<string, any>;

    const ALLOWED_FIELDS = [
        "name", "name_en", "name_it", "name_de", "name_fr", "name_es", "name_ru", "name_tr", "name_pt", "name_nl", "name_ja", "name_ar", "name_pl",
        "description", "description_en", "description_it", "description_de", "description_fr", "description_es", "description_ru", "description_tr", "description_pt", "description_nl", "description_ja", "description_ar", "description_pl",
        "price", "images", "videos",
        "category", "franchise", "subcategory", "status", "tags", "details", "rating", "reviewCount", "complexity_factor"
    ];

    const safePayload: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
             safePayload[field] = body[field];
        }
    }
    if (body.complexityFactor !== undefined) {
        safePayload.complexity_factor = body.complexityFactor;
    }

    // Safety: don't call update with empty obj
    if (Object.keys(safePayload).length === 0) {
         return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("products")
        .update(safePayload)
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

    // 1. Fetch product to get media URLs for cleanup
    const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("images, videos")
        .eq("id", id)
        .single();

    if (fetchError) {
        console.error("[api/admin/products] DELETE fetch error:", fetchError.message);
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 2. Extract paths for storage removal
    const mediaToCleanup: string[] = [];
    
    // Helper to get path relative to the bucket 'product-media'
    const getPathFromUrl = (url: string) => {
        if (url.includes('/product-media/')) {
            return url.split('/product-media/')[1];
        }
        return null;
    };

    if (product.images) {
        product.images.forEach((url: string) => {
            const path = getPathFromUrl(url);
            if (path) mediaToCleanup.push(path);
        });
    }
    if (product.videos) {
        product.videos.forEach((url: string) => {
            const path = getPathFromUrl(url);
            if (path) mediaToCleanup.push(path);
        });
    }

    // 3. Remove media from storage first
    if (mediaToCleanup.length > 0) {
        const { error: storageError } = await supabase.storage
            .from('product-media')
            .remove(mediaToCleanup);
        
        if (storageError) {
            console.error("[api/admin/products] Storage Cleanup Error:", storageError.message);
        }
    }

    // 4. Finally delete from database
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        // Handle Foreign Key Constraint (Postgres Code 23503)
        // If the product is linked to orders, we archive it instead of deleting it.
        if ((error as any).code === '23503') {
            const { error: archiveError } = await supabase
                .from("products")
                .update({ status: 'archived' })
                .eq("id", id);
            
            if (archiveError) {
                console.error("[api/admin/products] ARCHIVE fallback error:", archiveError.message);
                return NextResponse.json({ error: "Failed to archive product" }, { status: 400 });
            }

            return NextResponse.json({ success: true, archived: true });
        }

        console.error("[api/admin/products] DELETE error:", error.message);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 400 });
    }

    return NextResponse.json({ success: true, archived: false });
}
