"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, ProductScale, ProductFinish } from "@/types";

export interface CartStore {
  items: CartItem[];
  addItem: (
    product: Product,
    scale: ProductScale,
    finish: ProductFinish,
    price: number,
    quantity?: number
  ) => void;
  removeItem: (productId: string, scale: ProductScale, finish: ProductFinish) => void;
  updateQuantity: (
    productId: string,
    scale: ProductScale,
    finish: ProductFinish,
    quantity: number
  ) => void;
  clearCart: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, scale, finish, price, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.product.id === product.id &&
              item.selectedScale === scale &&
              item.selectedFinish === finish
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id &&
                  item.selectedScale === scale &&
                  item.selectedFinish === finish
                  ? {
                    ...item,
                    quantity: item.quantity + quantity,
                  }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity: quantity,
                selectedScale: scale,
                selectedFinish: finish,
                priceAtSelection: price,
              },
            ],
          };
        });
      },

      removeItem: (productId, scale, finish) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedScale === scale &&
                item.selectedFinish === finish
              )
          ),
        }));
      },

      updateQuantity: (productId, scale, finish, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, scale, finish);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
              item.selectedScale === scale &&
              item.selectedFinish === finish
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.priceAtSelection * item.quantity,
          0
        ),
    }),
    {
      name: "5ivearts-cart",
    }
  )
);
