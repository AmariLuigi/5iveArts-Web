"use client";

import { useSearchParams } from "next/navigation";
import { products, getProductsByCategory } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Figures" },
  { value: "hand-painted", label: "Hand-Painted" },
  { value: "home-printed", label: "3D-Printed" },
];

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? "all";

  const filtered: Product[] =
    categoryParam === "all"
      ? products
      : getProductsByCategory(categoryParam as Product["category"]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
        The Collection
      </h1>
      <p className="text-gray-500 mb-8">
        {filtered.length} figure{filtered.length !== 1 ? "s" : ""} available
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-3 mb-10">
        {CATEGORIES.map((cat) => {
          const isActive = categoryParam === cat.value;
          return (
            <a
              key={cat.value}
              href={cat.value === "all" ? "/products" : `/products?category=${cat.value}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {cat.label}
            </a>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No figures found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
