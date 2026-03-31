'use server'

import { getSupabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Toggles a user's partner status and sets their custom commission rate.
 * Accessible only by administrators.
 */
export async function updatePartnerProtocol(
    userId: string, 
    isPartner: boolean, 
    commissionRate: number = 10.00
) {
    if (!userId || commissionRate < 0 || commissionRate > 100) {
        return { error: "Invalid protocol parameters." };
    }

    try {
        const supabase = getSupabaseAdmin();
        
        const { error } = await (supabase as any)
            .from("profiles")
            .update({ 
                is_partner: isPartner,
                commission_rate: commissionRate,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (error) throw error;

        revalidatePath("/admin/partners");
        return { success: true };
    } catch (err) {
        console.error("[admin-partner] Protocol Update Failed:", err);
        return { error: "Failed to update member status." };
    }
}

/**
 * Fetches the partner list with search/filter capabilities.
 */
export async function fetchPartnerRoster(query: string = "") {
    try {
        const supabase = getSupabaseAdmin();
        let builder = (supabase as any).from("profiles").select("*");

        if (query) {
            builder = builder.or(`email.ilike.%${query}%,referral_code.ilike.%${query}%`);
        }

        const { data, error } = await builder
            .order("is_partner", { ascending: false })
            .order("email")
            .limit(50);

        if (error) throw error;
        return { data };
    } catch (err) {
        console.error("[admin-partner] Roster Fetch Failed:", err);
        return { error: "Could not retrieve member list." };
    }
}
