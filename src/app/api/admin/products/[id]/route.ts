import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase
        .from("products")
        .update(body)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
