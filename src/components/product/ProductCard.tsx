"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Tag } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/products";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const categoryLabel =
    product.category === "hand-painted" ? "Hand-Painted" : "3D-Printed";
  const categoryColor =
    product.category === "hand-painted"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="relative block aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
          }}
        />
        {/* Category badge */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${categoryColor}`}>
          <Tag className="w-3 h-3" />
          {categoryLabel}
        </span>
        {product.stock <= 3 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
            Sold Out
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/products/${product.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-snug mb-1">
          {product.name}
        </Link>
        <p className="text-sm text-gray-500 line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-700">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? "Sold Out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
