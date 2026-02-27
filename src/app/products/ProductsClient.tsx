"use client";

import { useSearchParams } from "next/navigation";
import { products, getProductsByCategory } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-screen">
      <div className="mb-16">
        <span className="text-[11px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">Premium series</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none">
          The Collection
        </h1>
        <p className="text-neutral-500 mt-4 text-xs font-bold uppercase tracking-widest">
          {initialProducts.length} Prototype{initialProducts.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {initialProducts.length === 0 ? (
        <div className="text-center py-32 text-white font-black uppercase tracking-widest text-sm opacity-20">
          No figures found in the arsenal.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {initialProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
