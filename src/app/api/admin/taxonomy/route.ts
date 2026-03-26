import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

/**
 * GET: Fetch all unique franchises and their related subcategories
 */
export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;

    try {
        // Fetch all products to derive taxonomy
        // Note: In a massive catalog, this should scan a dedicated taxonomy table, 
        // but for current scale, derivation from products ensures 100% data accuracy.
        const { data: products, error } = await supabase
            .from("products")
            .select("franchise, subcategory, category");

        if (error) throw error;

        const franchiseMap: Record<string, { name: string; types: Set<string>; subjects: Set<string> }> = {};

        products.forEach((p: any) => {
            if (!p.franchise) return;
            
            if (!franchiseMap[p.franchise]) {
                franchiseMap[p.franchise] = {
                    name: p.franchise,
                    types: new Set(),
                    subjects: new Set(),
                };
            }
            
            if (p.category) franchiseMap[p.franchise].types.add(p.category);
            if (p.subcategory) franchiseMap[p.franchise].subjects.add(p.subcategory);
        });

        // Convert Sets to Arrays for JSON serialization
        const result = Object.values(franchiseMap).map(f => ({
            ...f,
            types: Array.from(f.types),
            subjects: Array.from(f.subjects),
        })).sort((a,b) => a.name.localeCompare(b.name));

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("[api/admin/taxonomy] GET error:", error.message);
        return NextResponse.json({ error: "Failed to derive taxonomy" }, { status: 500 });
    }
}

/**
 * DELETE: Remove a taxonomy item from all products
 */
export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const { searchParams } = new URL(req.url);
    
    const type = searchParams.get('type'); // 'franchise' or 'subcategory'
    const value = searchParams.get('value');

    if (!type || !value) {
        return NextResponse.json({ error: "Missing type or value" }, { status: 400 });
    }

    try {
        const payload: Record<string, any> = {};
        payload[type] = null;

        const { error } = await supabase
            .from("products")
            .update(payload)
            .eq(type, value);

        if (error) throw error;

        return NextResponse.json({ success: true, message: `Purged ${value} from all products` });

    } catch (error: any) {
        console.error("[api/admin/taxonomy] DELETE error:", error.message);
        return NextResponse.json({ error: "Failed to purge taxonomy item" }, { status: 500 });
    }
}
