import { Product, ProductScale, ProductFinish } from "@/types";

export const SCALE_CONFIG: Record<ProductScale, { multiplier: number; size: string }> = {
  "1/12": { multiplier: 1.0, size: "15cm" },
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

export const products: Product[] = [
  {
    id: "spider-man-001",
    name: "Spider-Man",
    description:
      "A stunning action figure, individually crafted with precision 3D-printing and hand-applied acrylic paints. Every piece is unique and museum-quality.",
    price: 8999,
    images: ["/images/products/hp-spider-man.jpg"],
    videos: [],
    category: "figures",
    status: "published",
    stock: 5,
    details: [
      "High-Resolution Industrial Resin",
      "Professional Artisan Hand-Painting",
      "Museum-Grade UV-Resistant Varnish",
      "Precision Layer Height (0.025mm)",
      "Custom Signature Display Base",
      "Signature Foam-Padded Collector Box",
    ],
    rating: 4.9,
    reviewCount: 32,
  },
  {
    id: "batman-002",
    name: "Batman",
    description:
      "A dark and detailed figure featuring intricate weathering effects and museum-quality craftsmanship. Printed in premium resin for maximum detail.",
    price: 9499,
    images: ["/images/products/hp-batman.jpg"],
    videos: [],
    category: "figures",
    status: "published",
    stock: 3,
    details: [
      "High-Resolution Industrial Resin",
      "Professional Artisan Hand-Painting",
      "Museum-Grade UV-Resistant Varnish",
      "Precision Layer Height (0.025mm)",
      "Custom Signature Display Base",
      "Signature Foam-Padded Collector Box",
    ],
    rating: 4.8,
    reviewCount: 19,
  },
  {
    id: "wonder-woman-003",
    name: "Wonder Woman",
    description:
      "A breathtaking masterpiece featuring gold leaf detail and premium finishing. Every figure is a wearable piece of art from our workshop.",
    price: 9999,
    images: ["/images/products/hp-wonder-woman.jpg"],
    videos: [],
    category: "figures",
    status: "published",
    stock: 4,
    details: [
      "High-Resolution Industrial Resin",
      "Professional Artisan Hand-Painting",
      "Museum-Grade UV-Resistant Varnish",
      "Precision Layer Height (0.025mm)",
      "Custom Signature Display Base",
      "Signature Foam-Padded Collector Box",
    ],
    rating: 5.0,
    reviewCount: 11,
  },
  {
    id: "mandalorian-004",
    name: "The Mandalorian",
    description:
      "High-detail action figure printed in premium resin for crisp detail on every plate of bounty hunter armour. Battle-worn and ready for the collection.",
    price: 8499,
    images: ["/images/products/3dp-mandalorian.jpg"],
    videos: [],
    category: "figures",
    status: "published",
    stock: 10,
    details: [
      "High-Resolution Industrial Resin",
      "Professional Artisan Hand-Painting",
      "Museum-Grade UV-Resistant Varnish",
      "Precision Layer Height (0.025mm)",
      "Custom Signature Display Base",
      "Signature Foam-Padded Collector Box",
    ],
    rating: 4.7,
    reviewCount: 28,
  },
  {
    id: "iron-man-005",
    name: "Iron Man MK-IV",
    description:
      "Precision-crafted Iron Man MK-IV armour with panel-line engraving and premium finish options. A centerpiece for any Marvel display.",
    price: 9499,
    images: ["/images/products/3dp-iron-man.jpg"],
    videos: [],
    category: "figures",
    status: "published",
    stock: 8,
    details: [
      "High-Resolution Industrial Resin",
      "Professional Artisan Hand-Painting",
      "Museum-Grade UV-Resistant Varnish",
      "Precision Layer Height (0.025mm)",
      "Custom Signature Display Base",
      "Signature Foam-Padded Collector Box",
    ],
    rating: 4.8,
    reviewCount: 41,
  },
  {
    id: "master-chief-006",
    name: "Master Chief",
    description:
      "A faithful recreation of Master Chief's Mjolnir armour. Every surface detail from the armor layers has been faithfully translated into this high-resolution print.",
    price: 8999,
    images: ["/images/products/3dp-master-chief.jpg"],
    videos: [],
    category: "figures",
    status: "published",
    stock: 6,
    details: [
      "High-Resolution Industrial Resin",
      "Professional Artisan Hand-Painting",
      "Museum-Grade UV-Resistant Varnish",
      "Precision Layer Height (0.025mm)",
      "Custom Signature Display Base",
      "Signature Foam-Padded Collector Box",
    ],
    rating: 4.9,
    reviewCount: 23,
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(
  category: Product["category"]
): Product[] {
  return products.filter((p) => p.category === category);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
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

