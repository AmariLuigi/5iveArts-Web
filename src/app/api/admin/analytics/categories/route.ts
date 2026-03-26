import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;

    try {
        const { data, error } = await supabase
            .from("analytics_events")
            .select("event_data")
            .eq("event_type", "category_clicked")
            .limit(10000); 

        if (error) throw error;

        const catCounts: Record<string, number> = {};
        const subCounts: Record<string, number> = {};

        data?.forEach((item: any) => {
            const cat = item.event_data?.category;
            const sub = item.event_data?.subcategory;

            if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
            if (sub) subCounts[sub] = (subCounts[sub] || 0) + 1;
        });

        const sortAndSlice = (counts: Record<string, number>) => 
            Object.entries(counts)
                .map(([name, clicks]) => ({ name, clicks }))
                .sort((a, b) => b.clicks - a.clicks)
                .slice(0, 10);

        return NextResponse.json({
            categories: sortAndSlice(catCounts),
            subcategories: sortAndSlice(subCounts)
        });
    } catch (err: any) {
        console.error("[api/admin/analytics/categories] Error:", err.message);
        return NextResponse.json({ error: "Failed to fetch category rankings" }, { status: 500 });
    }
}
