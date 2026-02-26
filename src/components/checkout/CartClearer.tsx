"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

/**
 * Invisible client component that clears the Zustand cart on mount.
 * Include it on the checkout success page to ensure the cart is emptied
 * after a confirmed payment.
 */
export default function CartClearer() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
