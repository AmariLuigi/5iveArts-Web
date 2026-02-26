"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Zap } from "lucide-react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cart";

interface Props {
  product: Product;
}

export default function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  if (product.stock === 0) {
    return (
      <button
        disabled
        className="w-full bg-gray-200 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed"
      >
        Sold Out
      </button>
    );
  }

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product);
    router.push("/checkout");
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleAdd}
        className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all ${
          added
            ? "bg-green-500 text-white"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            Added to Cart!
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </>
        )}
      </button>

      <button
        onClick={handleBuyNow}
        className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all"
      >
        <Zap className="w-5 h-5" />
        Buy Now
      </button>
    </div>
  );
}
