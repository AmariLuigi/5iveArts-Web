"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Zap } from "lucide-react";
import { Product, ProductScale, ProductFinish } from "@/types";
import { useCartStore } from "@/store/cart";

interface Props {
  product: Product;
  selectedScale: ProductScale;
  selectedFinish: ProductFinish;
  currentPrice: number;
}

export default function AddToCartButton({ product, selectedScale, selectedFinish, currentPrice }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const handleAdd = () => {
    addItem(product, selectedScale, selectedFinish, currentPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedScale, selectedFinish, currentPrice);
    router.push("/checkout");
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] py-5 rounded transition-all text-xs ${added
          ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
          : "hasbro-btn-primary shadow-lg shadow-brand-yellow/10"
          }`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            Confirmed
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Add to Collection
          </>
        )}
      </button>

      <button
        onClick={handleBuyNow}
        className="w-full flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] py-5 rounded border-2 border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-all text-xs"
      >
        <Zap className="w-5 h-5 text-brand-yellow" />
        Instant Checkout
      </button>
    </div>
  );
}
