import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;

    try {
        // We want to count how many 'category_clicked' events we have for each category
        // Since we store category name inside event_data JSONB, we can use a raw SQL approach 
        // OR fetch and aggregate in JS. Given Vercel limits, we should try a smart query.
        
        const { data, error } = await supabase
            .from("analytics_events")
            .select("event_data->category")
            .eq("event_type", "category_clicked")
            .limit(5000); // Analyze recent 5000 clicks

        if (error) throw error;

        // Aggregate in JS (since Supabase select doesn't easily support JSONB grouping in basic JS client)
        const counts: Record<string, number> = {};
        data?.forEach((item: any) => {
            if (item.category) {
                counts[item.category] = (counts[item.category] || 0) + 1;
            }
        });

        const ranked = Object.entries(counts)
            .map(([name, clicks]) => ({ name, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10); // Top 10

        return NextResponse.json(ranked);
    } catch (err: any) {
        console.error("[api/admin/analytics/categories] Error:", err.message);
        return NextResponse.json({ error: "Failed to fetch category rankings" }, { status: 500 });
    }
}
