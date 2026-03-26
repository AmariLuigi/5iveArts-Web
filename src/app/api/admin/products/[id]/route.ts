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
        "name", "description", 
        "description_en", "description_it", "description_de", "description_fr", "description_es",
        "price", "images", "videos",
        "category", "status", "tags", "details", "rating", "reviewCount"
    ];

    const safePayload: Record<string, any> = {};
    for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
             safePayload[field] = body[field];
        }
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
        if (!url) return null;
        try {
            // Check if it's a Supabase storage URL
            if (url.includes('/storage/v1/object/public/product-media/')) {
                return url.split('/storage/v1/object/public/product-media/')[1];
            }
            return null;
        } catch (e) {
            return null;
        }
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

    // 3. Delete from Storage if paths found
    if (mediaToCleanup.length > 0) {
        const { error: storageError } = await supabase.storage
            .from('product-media')
            .remove(mediaToCleanup);
            
        if (storageError) {
            console.error("[api/admin/products] Storage cleanup error:", storageError.message);
            // We continue anyway so the DB record can be deleted even if storage cleanup fails partially
        }
    }

    // 4. Delete DB record
    const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (deleteError) {
        console.error("[api/admin/products] DELETE record error:", deleteError.message);
        return NextResponse.json({ error: "Failed to delete product record" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
