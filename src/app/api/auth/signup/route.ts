import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifySolution, pbkdf2 } from "altcha/lib";

/**
 * API route to create a new user account with ALTCHA PoW verification.
 * This is triggered from the checkout success page.
 */
export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
    // Strict signup rate limit (3 attempts per minute per IP)
    const rl = checkRateLimit(`signup:${ip}`, { limit: 3, windowMs: 60_000 });
    
    if (!rl.success) {
        return NextResponse.json(
            { error: "Protocol Throttled: Too many attempts. Please wait." },
            { 
                status: 429, 
                headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
            }
        );
    }

    try {
        const { email, password, sessionId, altcha } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. CAPTCHA Verification (ALTCHA PoW)
        if (!altcha) {
            return NextResponse.json({ error: "Human verification required" }, { status: 400 });
        }

        try {
            const hmacKey = process.env.ALTCHA_HMAC_KEY;
            if (!hmacKey) throw new Error("Security Infrastructure Offline");

            const payloadBytes = Buffer.from(altcha, "base64");
            const payloadObj = JSON.parse(payloadBytes.toString());

            console.log("[signup-api] Decoding ALTCHA payload for verification.");

            const result = await verifySolution({
                challenge: payloadObj.challenge,
                solution: payloadObj.solution,
                hmacSignatureSecret: hmacKey,
                deriveKey: pbkdf2.deriveKey,
            });

            if (!result.verified) {
                if (result.expired) throw new Error("Verification Task Expired");
                if (result.invalidSignature) throw new Error("Security Signature Mismatch");
                if (result.invalidSolution) throw new Error("Cryptographic Challenge Mismatch");
                throw new Error("Verification protocol failure");
            }

            console.log(`[signup-api] ALTCHA PoW verified in ${result.time}ms.`);

        } catch (err: any) {
            console.error("[signup-api] Authentication Shield Rejected Payload:", err.message);
            return NextResponse.json({ 
                error: `Verification Sync Failure: ${err.message}. Please restart the link.` 
            }, { status: 400 });
        }

        const supabaseServer = await createClient();
        const supabaseAdmin = getSupabaseAdmin();

        // 2. Administrative Pre-Check
        const { data: existing } = await (supabaseAdmin as any)
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ 
                error: "Identity already archived in the vault. Please login to continue." 
            }, { status: 400 });
        }

        // 3. Create the user in Supabase Auth
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
             console.error("[signup-api] Supabase Auth Refusal:", signupError.message);
            return NextResponse.json({ error: signupError.message }, { status: 400 });
        }

        const user = authData.user;
        if (!user) {
            return NextResponse.json({ error: "Vault Entry Failed: Null Identity Return" }, { status: 500 });
        }

        // 4. Link the order to the new user (if organic registration, sessionId is null)
        if (sessionId) {
            const { error: updateError } = await (supabaseAdmin as any)
                .from("orders")
                .update({ user_id: user.id })
                .eq("stripe_session_id", sessionId);

            if (updateError) {
                console.error("[signup-api] Failed to link order to user:", updateError);
            }
        }

        console.log(`[signup-api] Identity ${user.email} verified and archived.`);

        return NextResponse.json({ 
            success: true, 
            user: { id: user.id, email: user.email } 
        });

    } catch (err: any) {
        console.error("[signup-api] Protocol Crash:", err.message);
        return NextResponse.json({ error: "Critical internal error" }, { status: 500 });
    }
}
