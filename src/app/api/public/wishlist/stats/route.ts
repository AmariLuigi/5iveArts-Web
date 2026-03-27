import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    // Aggregate desired products using SQL grouping
    // We can use a direct RPC call if we want to be efficient,
    // or just fetch counts from the table.
    
    const { data: statsData, error: statsError } = await (supabase.rpc('get_wishlist_stats') as any);

    if (statsError) return NextResponse.json({ error: statsError.message }, { status: 500 });
    if (!statsData || statsData.length === 0) return NextResponse.json([]);

    // Fetch the product details for the trending IDs
    const productIds = statsData.slice(0, 8).map((s: any) => s.p_id);
    const { data: products, error: productsError } = await supabase
        .from("products")
        .select(`
            id,
            name,
            name_en,
            images
        `)
        .in("id", productIds);

    if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

    const mostDesired = statsData.map((s: any) => ({
        product: products?.find((p: any) => p.id === s.p_id),
        count: s.desire_count
    })).filter((item: any) => item.product);

    return NextResponse.json(mostDesired);
}

export const dynamic = 'force-dynamic';
