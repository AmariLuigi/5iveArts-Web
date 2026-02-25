export type ProductCategory = "hand-painted" | "home-printed";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  images: string[];
  category: ProductCategory;
  stock: number;
  details: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
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
