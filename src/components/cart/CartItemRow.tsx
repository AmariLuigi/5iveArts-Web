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
    <div className="flex gap-6 p-6 items-start">
      {/* Image */}
      <Link href={`/products/${item.product.id}`} className="relative w-24 h-24 flex-shrink-0 border border-white/5 overflow-hidden bg-neutral-900 shadow-xl group">
        <Image
          src={item.product.images[0]}
          alt={item.product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="96px"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1594818821917-384460061e72?auto=format&fit=crop&q=80&w=800";
          }}
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 py-1">
        <Link href={`/products/${item.product.id}`} className="font-black uppercase tracking-tight text-white hover:text-brand-yellow transition-colors leading-none block text-lg">
          {item.product.name}
        </Link>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[9px] uppercase font-black bg-white/5 text-neutral-400 px-2 py-0.5 border border-white/5 rounded-sm tracking-widest">
            Scale: {item.selectedScale}
          </span>
          <span className="text-[9px] uppercase font-black bg-white/5 text-neutral-400 px-2 py-0.5 border border-white/5 rounded-sm tracking-widest uppercase">
            {item.selectedFinish}
          </span>
        </div>
        <p className="text-sm font-black text-brand-yellow mt-3 tracking-tighter">
          {formatPrice(item.priceAtSelection)}
        </p>
      </div>

      {/* Quantity + remove */}
      <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 py-1">
        <button
          onClick={() => removeItem(item.product.id, item.selectedScale, item.selectedFinish)}
          className="text-neutral-600 hover:text-red-500 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-end gap-3 mt-4">
          <div className="flex items-center bg-[#111] border border-white/5 rounded overflow-hidden">
            <button
              onClick={() => updateQuantity(item.product.id, item.selectedScale, item.selectedFinish, item.quantity - 1)}
              className="p-2 hover:bg-white/5 text-white transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.product.id, item.selectedScale, item.selectedFinish, item.quantity + 1)}
              className="p-2 hover:bg-white/5 text-white transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-lg font-black text-white tracking-tighter">
            {formatPrice(item.priceAtSelection * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
