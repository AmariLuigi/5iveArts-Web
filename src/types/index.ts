export type ProductCategory = "figures" | "busts" | "dioramas";

export type ProductScale = "1/9" | "1/6" | "1/4";
export type ProductFinish = "painted" | "raw";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // base price in cents (relative to 1/12 multiplier)
  images: string[];
  videos: string[];
  category: ProductCategory;
  status: "draft" | "published";
  details: string[];
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

export interface OrderSummary {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingRate?: ShippingRate;
}
