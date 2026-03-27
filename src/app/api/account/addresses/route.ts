import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await (supabase.from("user_addresses") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    // If this is the first address, or is_default is true, handle default logic
    const { count } = await supabase
        .from("user_addresses")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

    const isDefault = (count === 0) || body.is_default;

    if (isDefault) {
        await (supabase.from("user_addresses") as any)
            .update({ is_default: false })
            .eq("user_id", user.id);
    }

    const { data, error } = await (supabase.from("user_addresses") as any)
        .insert({
            ...body,
            user_id: user.id,
            is_default: isDefault
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
