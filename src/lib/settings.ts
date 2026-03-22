import { getSupabasePublic } from "./supabase";

export interface SiteSettings {
    pricing?: {
        scales: Record<string, { multiplier: number; size: string }>;
        finishes: Record<string, { multiplier: number }>;
    };
    identity?: {
        hero_title: string;
        hero_subtitle: string;
    };
    logistics?: {
        preparation_days_buffer: number;
        free_shipping_threshold_cents: number;
    };
    homepage?: {
        featured_product_ids: string[];
        hero_videos?: string[];
    };
}

/**
 * Global site settings fetched from the 'site_settings' table.
 * Uses the public client and is cached per request.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
    const supabase = getSupabasePublic();
    const { data, error } = await supabase
        .from("site_settings")
        .select("*");

    if (error) {
        console.error("[settings] Error fetching site settings:", error);
        return {};
    }

    // Convert flat array of {key, value} to a structured object
    const settings: any = {};
    ((data as any[]) || []).forEach((row) => {
        settings[row.key] = row.value;
    });

    return settings as SiteSettings;
}
