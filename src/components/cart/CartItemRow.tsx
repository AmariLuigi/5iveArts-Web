"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/types";
import { formatPrice } from "@/lib/products";
import { useCartStore } from "@/store/cart";

interface CartItemRowProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Image */}
      <Link href={`/products/${item.product.id}`} className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
        <Image
          src={item.product.images[0]}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="80px"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
          }}
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.product.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
          {item.product.name}
        </Link>
        <p className="text-sm text-gray-500 mt-0.5">
          {item.product.category === "hand-painted" ? "Hand-Painted" : "3D-Printed"}
        </p>
        <p className="text-sm font-semibold text-indigo-700 mt-1">
          {formatPrice(item.product.price)}
        </p>
      </div>

      {/* Quantity + remove */}
      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <button
          onClick={() => removeItem(item.product.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="p-1 hover:bg-gray-100 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            disabled={item.quantity >= item.product.stock}
            className="p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <span className="text-sm font-bold text-gray-900">
          {formatPrice(item.product.price * item.quantity)}
        </span>
      </div>
    </div>
  );
}
