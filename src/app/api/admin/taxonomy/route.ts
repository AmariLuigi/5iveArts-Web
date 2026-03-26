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
        const { data: products, error } = await supabase
            .from("products")
            .select("franchise, subcategory, category, tags");

        if (error) throw error;

        const taxonomyMap: Record<string, { name: string; types: Set<string>; subjects: Set<string>; isLegacy?: boolean; isCategorical?: boolean }> = {};
        const unmappedTags = new Set<string>();

        products.forEach((p: any) => {
            // Priority 1: Primary Structured Taxonomy (The Core Masterpieces)
            if (p.franchise) {
                if (!taxonomyMap[p.franchise]) {
                    taxonomyMap[p.franchise] = { name: p.franchise, types: new Set(), subjects: new Set() };
                }
                if (p.category) taxonomyMap[p.franchise].types.add(p.category);
                if (p.subcategory) taxonomyMap[p.franchise].subjects.add(p.subcategory);
            }

            // Priority 2: Categorical Lore (The Artist/Series/Edition Nodes)
            if (p.tags && Array.isArray(p.tags)) {
                p.tags.forEach((tag: string) => {
                    if (tag.includes(':')) {
                        const [nodeName, subject] = tag.split(':');
                        if (!taxonomyMap[nodeName]) {
                            taxonomyMap[nodeName] = { name: nodeName, types: new Set(), subjects: new Set(), isCategorical: true };
                        }
                        taxonomyMap[nodeName].subjects.add(subject);
                    } else {
                        // Priority 3: Truly Unmapped Flat Tags (Legacy Discovery)
                        if (tag !== p.franchise && tag !== p.subcategory) {
                            unmappedTags.add(tag);
                        }
                    }
                });
            }
        });

        const result = [
            ...Object.values(taxonomyMap).map(f => ({
                ...f,
                types: Array.from(f.types),
                subjects: Array.from(f.subjects),
            })),
            // Standalone unmapped tags for bulk cleanup
            ...(unmappedTags.size > 0 ? [{
                name: "Unmapped Discovery",
                isLegacy: true,
                types: [],
                subjects: Array.from(unmappedTags)
            }] : [])
        ].sort((a,b) => a.name.localeCompare(b.name));

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
        if (type === 'tags') {
            // Bulk tag removal (JSONB array logic)
            // 1. Fetch products having this tag
            const { data: products, error: fetchErr } = await supabase
                .from("products")
                .select("id, tags")
                .contains("tags", [value]);

            if (fetchErr) throw fetchErr;

            // 2. Perform updates for each product (batching could be improved but fine for this scope)
            for (const p of (products || [])) {
                const newTags = p.tags.filter((t: string) => t !== value);
                await supabase.from("products").update({ tags: newTags }).eq("id", p.id);
            }
        } else {
            const payload: Record<string, any> = {};
            payload[type] = null;

            const { error } = await supabase
                .from("products")
                .update(payload)
                .eq(type, value);

            if (error) throw error;
        }

        return NextResponse.json({ success: true, message: `Purged ${value} from all products` });

    } catch (error: any) {
        console.error("[api/admin/taxonomy] DELETE error:", error.message);
        return NextResponse.json({ error: "Failed to purge taxonomy item" }, { status: 500 });
    }
}
