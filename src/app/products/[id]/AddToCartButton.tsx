"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cart";

interface Props {
  product: Product;
}

export default function AddToCartButton({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

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

  return (
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
  );
}
