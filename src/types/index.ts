export type ProductCategory = "figures" | "busts" | "dioramas";

export type ProductScale = "1/9" | "1/6" | "1/4";
export type ProductFinish = "painted" | "raw";

export interface Product {
  id: string;
  name: string;
  name_en?: string | null; name_it?: string | null; name_de?: string | null; name_fr?: string | null; name_es?: string | null;
  name_ru?: string | null; name_tr?: string | null; name_pt?: string | null; name_nl?: string | null; name_ja?: string | null; name_ar?: string | null; name_pl?: string | null;
  description: string;
  description_en?: string | null; description_it?: string | null; description_de?: string | null; description_fr?: string | null; description_es?: string | null;
  description_ru?: string | null; description_tr?: string | null; description_pt?: string | null; description_nl?: string | null; description_ja?: string | null; description_ar?: string | null; description_pl?: string | null;
  price: number; // base price in cents (relative to 1/12 multiplier)
  images: string[];
  videos: string[];
  category: ProductCategory;
  franchise?: string | null;
  subcategory?: string | null;
  status: "draft" | "published" | "archived";
  tags: string[];
  rating?: number;
  reviewCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedScale: ProductScale;
  selectedFinish: ProductFinish;
  priceAtSelection: number; // the price calculated based on variants
}

export interface ShippingRate {
  service_id: string;
  carrier_name: string;
  service_name: string;
  price: number; // in cents
  original_price?: number; // original price before subsidies (to show discount)
  currency: string;
  estimated_days: number;
}

export interface ShippingAddress {
  full_name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  email: string;
}

export interface UserAddress extends ShippingAddress {
  id: string;
  user_id: string;
  is_default: boolean;
  created_at: string;
}

export interface WishlistItem {
  product_id: string;
  user_id: string;
  created_at: string;
  product?: Product; // Optional join
}
