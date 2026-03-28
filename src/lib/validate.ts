/**
 * Lightweight input validation helpers for API route handlers.
 * Avoids adding a heavy schema-validation library — uses plain TypeScript.
 */

import { ShippingAddress, CartItem } from "@/types";
import { getProductById, calculatePrice } from "@/lib/products";
import { ProductScale, ProductFinish } from "@/types";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Trims a string and returns null if it is empty after trimming. */
function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Clamps a number to [min, max] and returns null if value is not a number. */
export function sanitizeNumber(
  value: unknown,
  min: number,
  max: number
): number | null {
  const n = Number(value);
  if (isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

/** Escapes special HTML characters to prevent XSS. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Returns true for a reasonable-looking email address. */
function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value) && value.length <= 254;
}

import { countries } from "@/lib/countries";

// ISO 3166-1 alpha-2 allow-list for shipping destinations
const ALLOWED_COUNTRIES = new Set(countries.map(c => c.code));

// ---------------------------------------------------------------------------
// Shipping address
// ---------------------------------------------------------------------------

export interface ValidationResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Validates and sanitises a raw shipping address object from an API request.
 */
export function validateShippingAddress(
  raw: unknown
): ValidationResult<ShippingAddress> {
  if (!raw || typeof raw !== "object") {
    return { data: null, error: "shippingAddress is required" };
  }
  const r = raw as Record<string, unknown>;

  const full_name = sanitizeString(r.full_name);
  const street1 = sanitizeString(r.street1);
  const city = sanitizeString(r.city);
  const zip_code = sanitizeString(r.zip_code);
  const country = sanitizeString(r.country);
  const phone = sanitizeString(r.phone);
  const email = sanitizeString(r.email);

  if (!full_name) return { data: null, error: "full_name is required" };
  if (!street1) return { data: null, error: "street1 is required" };
  if (!city) return { data: null, error: "city is required" };
  if (!zip_code) return { data: null, error: "zip_code is required" };
  if (!country) return { data: null, error: "country is required" };
  if (!ALLOWED_COUNTRIES.has(country))
    return { data: null, error: `Shipping to "${country}" is not supported` };
  if (!phone) return { data: null, error: "phone is required" };
  if (!email) return { data: null, error: "email is required" };
  if (!isValidEmail(email)) return { data: null, error: "email is invalid" };

  return {
    data: {
      full_name,
      street1,
      street2: sanitizeString(r.street2) ?? undefined,
      city,
      state: sanitizeString(r.state) ?? "",
      zip_code,
      country,
      phone,
      email,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Cart items
// ---------------------------------------------------------------------------

/**
 * Validates cart items from an API request body.
 * Cross-checks product IDs and prices against the server-side catalogue —
 * never trusting client-supplied prices.
 */
export async function validateCartItems(raw: unknown): Promise<ValidationResult<CartItem[]>> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { data: null, error: "items must be a non-empty array" };
  }
  if (raw.length > 50) {
    return { data: null, error: "Too many items in cart" };
  }

  const items: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      return { data: null, error: "Each cart item must be an object" };
    }
    const e = entry as Record<string, unknown>;
    const productId = sanitizeString(
      (e.product as Record<string, unknown>)?.id
    );
    if (!productId) {
      return { data: null, error: "Each item must have a product.id" };
    }
    const serverProduct = await getProductById(productId);

    if (!serverProduct) {
      return { data: null, error: `Unknown product id: ${productId}` };
    }

    const scale = e.selectedScale as ProductScale;
    const finish = e.selectedFinish as ProductFinish;

    if (!scale || !["1/9", "1/6", "1/4"].includes(scale)) {
      return { data: null, error: `Invalid scale for product ${productId}` };
    }
    if (!finish || !["painted", "raw"].includes(finish)) {
      return { data: null, error: `Invalid finish for product ${productId}` };
    }

    const quantity = sanitizeNumber(e.quantity, 1, 999);
    if (quantity === null) {
      return { data: null, error: `Invalid quantity for product ${productId}` };
    }

    const serverPrice = calculatePrice(
      serverProduct.price, 
      scale, 
      finish, 
      undefined, 
      serverProduct.complexityFactor
    );

    items.push({
      product: serverProduct,
      quantity,
      selectedScale: scale,
      selectedFinish: finish,
      priceAtSelection: serverPrice,
    });
  }

  return { data: items, error: null };
}
