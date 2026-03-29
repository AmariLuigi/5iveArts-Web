import { getSupabasePublic } from "./supabase";

export interface Testimonial {
    name: string;
    role: string;
    quote: string; // Master quote (fallback)
    quote_en?: string;
    quote_it?: string;
    quote_de?: string;
    quote_fr?: string;
    quote_es?: string;
    quote_ru?: string;
    quote_tr?: string;
    quote_pt?: string;
    quote_nl?: string;
    quote_ja?: string;
    quote_ar?: string;
    quote_pl?: string;
    rating: 1 | 2 | 3 | 4 | 5;
    avatar?: string;
    gender?: 'male' | 'female' | 'neutral';
}

export interface StatItem {
    value: number;
    suffix: string;
}

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
        testimonials?: Testimonial[];
        stats?: {
            collectorsVault?: StatItem;
            satisfactionRate?: StatItem;
            countriesServed?: StatItem;
            yearsExperience?: StatItem;
        };
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
