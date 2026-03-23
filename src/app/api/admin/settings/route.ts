import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response!;

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("site_settings")
        .select("*");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert flat array of {key, value} to a structured object
    const settings: Record<string, any> = {};
    (data || []).forEach((row: any) => {
        settings[row.key] = row.value;
    });

    return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response!;

    try {
        const body = await req.json();
        const supabase = await createClient();

        // Expect body like { "pricing": { ... }, "logistics": { ... }, "homepage": { ... } }
        // To prevent arbitrary data injection in the db, only allow known keys.
        const ALLOWED_KEYS = ["pricing", "logistics", "homepage"];

        const entries = Object.entries(body).filter(([key]) => ALLOWED_KEYS.includes(key));

        for (const [key, value] of entries) {
            const { error } = await (supabase as any)
                .from("site_settings")
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'key'
                });

            if (error) {
                console.error(`[settings-patch] Error upserting ${key}:`, error);
                return NextResponse.json({ error: `Failed to update ${key}: ${error.message}` }, { status: 500 });
            }
        }
        
        // Ensure changes are reflected on the frontend immediately
        revalidatePath("/", "layout");

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
