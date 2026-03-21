import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * API route to resend the confirmation email to the current user.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
            emailRedirectTo: `${req.nextUrl.origin}/account`,
        }
    });

    if (error) {
        console.error("[resend-api] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Redirect back to settings with a success flag
    return NextResponse.redirect(new URL("/account/settings?resend=success", req.url), {
        status: 302,
    });
}
