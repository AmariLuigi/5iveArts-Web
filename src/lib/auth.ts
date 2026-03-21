import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Shared authentication helper for API routes.
 * Provides defense-in-depth by verifying the user session and admin email
 * within the route handler itself, in addition to middleware checks.
 */
export async function requireAdmin(req: NextRequest) {
    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignore header modification errors in route handlers
                    }
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!user || !adminEmail || user.email !== adminEmail) {
        return {
            authorized: false,
            response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    return { authorized: true, user };
}
