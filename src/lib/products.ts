import { Product, ProductScale, ProductFinish } from "@/types";

export const SCALE_CONFIG: Record<ProductScale, { multiplier: number; size: string }> = {
  "1/9": { multiplier: 1.5, size: "20cm" },
  "1/6": { multiplier: 2.5, size: "30cm" },
  "1/4": { multiplier: 5.0, size: "45cm" },
};

export const FINISH_CONFIG: Record<ProductFinish, { multiplier: number }> = {
  painted: { multiplier: 1.0 },
  raw: { multiplier: 0.6 },
};

export function calculatePrice(basePrice: number, scale: ProductScale, finish: ProductFinish): number {
  return Math.round(basePrice * SCALE_CONFIG[scale].multiplier * FINISH_CONFIG[finish].multiplier);
}

import { getSupabasePublic } from "./supabase";

export async function fetchProductsFromDb(): Promise<Product[]> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[products] Error fetching products from Supabase:", error);
    return [];
  }

  return (data as any) as Product[];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;
  return data as Product;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

