import { Product, ProductScale, ProductFinish } from "@/types";

export const SCALE_CONFIG: Record<ProductScale, { multiplier: number; size: string }> = {
  "1/9": { multiplier: 1.0, size: "20cm" },
  "1/6": { multiplier: 1.7, size: "30cm" },
  "1/4": { multiplier: 3.2, size: "45cm" },
};

const FINISH_CONFIG: Record<ProductFinish, { multiplier: number }> = {
  painted: { multiplier: 1.0 },
  raw: { multiplier: 0.2941 }, // Ratio of 25.00 / 85.00 (approx) for base ref 1/9
};

export function calculatePrice(
  basePrice: number, 
  scale: ProductScale, 
  finish: ProductFinish, 
  pricingSettings?: any,
  complexityFactor: number = 1.0
): number {
  const scaleMult = pricingSettings?.scales?.[scale]?.multiplier ?? SCALE_CONFIG[scale].multiplier;
  const finishMult = pricingSettings?.finishes?.[finish]?.multiplier ?? FINISH_CONFIG[finish].multiplier;
  
  // New Formula: (BasePrice * ScaleMultiplier * FinishMultiplier) * ComplexityFactor
  return Math.round((basePrice * scaleMult * finishMult) * complexityFactor);
}

import { getSupabasePublic } from "./supabase";

export async function fetchProductsFromDb(): Promise<Product[]> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .neq("name", "Custom Commission Prototype") // Hide placeholder from main list
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[products] Error fetching products from Supabase:", error);
    return [];
  }

  return (data as any[]).map(p => ({
    ...p,
    complexityFactor: p.complexity_factor
  })) as Product[];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !data) return undefined;
  const p = data as any;
  return {
    ...p,
    complexityFactor: p.complexity_factor
  } as Product;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

