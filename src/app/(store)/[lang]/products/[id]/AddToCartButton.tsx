"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Zap } from "lucide-react";
import { Product, ProductScale, ProductFinish } from "@/types";
import { useCartStore, CartStore } from "@/store/cart";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Props {
  product: Product;
  selectedScale: ProductScale;
  selectedFinish: ProductFinish;
  currentPrice: number;
  lang: string;
  dict: any;
}

export default function AddToCartButton({ product, selectedScale, selectedFinish, currentPrice, lang, dict }: Props) {
  const addItem = useCartStore((state: CartStore) => state.addItem);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const { track } = useAnalytics();

  const handleAdd = () => {
    addItem(product, selectedScale, selectedFinish, currentPrice);
    track("add_to_cart", {
      product_id: product.id,
      product_name: product.name,
      variant_scale: selectedScale,
      variant_finish: selectedFinish,
      price: currentPrice,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedScale, selectedFinish, currentPrice);
    track("add_to_cart", {
      product_id: product.id,
      product_name: product.name,
      variant_scale: selectedScale,
      variant_finish: selectedFinish,
      price: currentPrice,
      quantity: 1,
      buy_now: true,
    });
    router.push(`/${lang}/checkout`);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-2 font-black uppercase tracking-[0.15em] py-5 rounded transition-all text-[10px] ${added
          ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
          : "hasbro-btn-primary shadow-lg shadow-brand-yellow/10"
          }`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            <span className="truncate">{dict.product_detail.confirmed}</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 text-black" />
            <span className="truncate">{dict.product_detail.addToCollection}</span>
          </>
        )}
      </button>

      <button
        onClick={handleBuyNow}
        className="w-full flex items-center justify-center gap-2 font-black uppercase tracking-[0.15em] py-5 rounded border-2 border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-all text-[10px]"
      >
        <Zap className="w-4 h-4 text-brand-yellow" />
        <span className="truncate">{dict.product_detail.instantCheckout}</span>
      </button>
    </div>
  );
}

