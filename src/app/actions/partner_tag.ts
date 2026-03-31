"use server";

import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Updates a Partner's referral tag with global uniqueness validation.
 */
export async function updatePartnerTag(newTag: string) {
    try {
        const supabase = await createClient();
        const adminSupabase = getSupabaseAdmin();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        // 1. Verify Partner Status
        const { data: profile } = await adminSupabase
            .from("profiles")
            .select("is_partner")
            .eq("id", user.id)
            .single();

        if (!profile?.is_partner) throw new Error("Exclusive to authorized Partners");

        // 2. Clean and Validate Tag
        const cleanTag = newTag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanTag.length < 3 || cleanTag.length > 20) {
            throw new Error("Signature must be between 3 and 20 alphanumeric characters.");
        }

        // 3. Uniqueness Check
        const { data: existing } = await adminSupabase
            .from("profiles")
            .select("id")
            .eq("referral_code", cleanTag)
            .neq("id", user.id)
            .maybeSingle();

        if (existing) {
            throw new Error("This signature is already claimed by another Fellow.");
        }

        // 4. Update Protocol
        const { error: updateError } = await (supabase as any)
            .from("profiles")
            .update({ referral_code: cleanTag })
            .eq("id", user.id);

        if (updateError) throw updateError;

        revalidatePath("/(store)/[lang]/account", "layout");
        return { success: true, tag: cleanTag };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
