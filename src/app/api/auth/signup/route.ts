import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * API route to create a new user account and link the current order to it.
 * This is triggered from the checkout success page.
 */
export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`signup:${ip}`, { limit: 3, windowMs: 60_000 });
    
    if (!rl.success) {
        return NextResponse.json(
            { error: "Too many sign-up attempts. Please wait a moment." },
            { 
                status: 429, 
                headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
            }
        );
    }

    try {
        const { email, password, sessionId } = await req.json();

        if (!email || !password || !sessionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabaseServer = await createClient();
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Create the user in Supabase Auth (Standard Flow)
        const { data: authData, error: signupError } = await supabaseServer.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: email.split('@')[0],
                }
            }
        });

        if (signupError) {
            if (signupError.status === 400 || signupError.message.includes("already registered")) {
                return NextResponse.json({ 
                    error: "An account with this email already exists. Please login to manage your orders." 
                }, { status: 400 });
            }
            return NextResponse.json({ error: signupError.message }, { status: 400 });
        }

        const user = authData.user;
        if (!user) {
            return NextResponse.json({ error: "Signup failed to return user data." }, { status: 500 });
        }

        // 2. Link the order to the new user
        // We use the admin client here to ensure we can update the row regardless of RLS
        const { error: updateError } = await (supabaseAdmin as any)
            .from("orders")
            .update({ user_id: user.id })
            .eq("stripe_session_id", sessionId);

        if (updateError) {
            console.error("[signup-api] Failed to link order to user:", updateError);
            // We continue anyway as the account was created
        }

        console.log(`[signup-api] User ${user.email} created and linked to session ${sessionId}`);

        return NextResponse.json({ 
            success: true, 
            user: { id: user.id, email: user.email } 
        });

    } catch (err: any) {
        console.error("[signup-api] Crash:", err.message);
        return NextResponse.json({ error: "Critical internal error" }, { status: 500 });
    }
}
