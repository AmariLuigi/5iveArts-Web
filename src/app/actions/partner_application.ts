'use server'

import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Submits a new candidacy for the 5ive Arts Fellowship.
 */
export async function submitPartnerApplication(formData: {
    fullName: string;
    email: string;
    socialMedia: Record<string, string>;
    website?: string;
    bio?: string;
    reachEstimate?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Authentication required to submit candidacy." };

        const { error } = await (supabase as any).from("partner_applications").insert({
            user_id: user.id,
            full_name: formData.fullName,
            email: formData.email,
            social_media: formData.socialMedia,
            website: formData.website,
            bio: formData.bio,
            reach_estimate: formData.reachEstimate,
            status: 'pending'
        });

        if (error) {
            if (error.code === '23505') return { error: "Candidacy already registered in our vault." };
            throw error;
        }

        revalidatePath("/account");
        return { success: true };
    } catch (err) {
        console.error("[partner-apply] Protocol Launch Failed:", err);
        return { error: "Candidacy submission failed. Please re-initiate." };
    }
}

/**
 * Retrieves all pending candidacies for the Admin Command Center.
 */
export async function getPartnerApplications() {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("partner_applications")
            .select("*, profiles!inner(email, referral_code)")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data };
    } catch (err) {
        console.error("[admin-apply] Fetch Failed:", err);
        return { error: "Could not retrieve the candidacy roster." };
    }
}

/**
 * Approves a candidate and automatically initializes their Partner Status.
 */
export async function approvePartnerApplication(applicationId: string, userId: string) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Update Application Status
        const { error: appError } = await (supabase as any)
            .from("partner_applications")
            .update({ status: 'approved' })
            .eq("id", applicationId);

        if (appError) throw appError;

        // 2. Promote Profile to Partner (using our existing protocol logic)
        const { error: profileError } = await (supabase as any)
            .from("profiles")
            .update({
                is_partner: true,
                commission_rate: 10.00, // Default initialization
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (profileError) throw profileError;

        revalidatePath("/admin/partners");
        revalidatePath("/account");
        return { success: true };
    } catch (err) {
        console.error("[admin-apply] Approval Failed:", err);
        return { error: "Could not authorize the candidate." };
    }
}
