'use server'

import { getSupabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";

/**
 * Validates a referral code and logs a click in the database for partner analytics.
 * Returns the UUID of the referrer if valid, otherwise null.
 */
export async function trackReferral(code: string): Promise<string | null> {
    if (!code || code.length > 50) return null;

    try {
        const supabase = getSupabaseAdmin();
        const headerList = await headers();
        const ip = headerList.get("x-forwarded-for") || "0.0.0.0";
        const userAgent = headerList.get("user-agent") || "Unknown";

        // 1. Resolve the code to a Referrer ID
        const { data: profile, error } = await (supabase as any)
            .from("profiles")
            .select("id, is_partner")
            .eq("referral_code", code)
            .maybeSingle();

        if (error || !profile) {
            console.warn(`[referral-track] Invalid code attempt: ${code}`);
            return null;
        }

        // 2. Log the click for analytics (and fraud detection)
        // We do this in the background to not block the user experience
        await (supabase as any).from("referral_clicks").insert({
            referrer_id: profile.id,
            ip_address: ip,
            user_agent: userAgent,
            path: "/" // V1 simplification, could be more granular later
        });

        return profile.id;
    } catch (err) {
        console.error("[referral-track] Error:", err);
        return null;
    }
}
