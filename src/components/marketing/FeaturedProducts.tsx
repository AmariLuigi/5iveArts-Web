import Link from "next/link";
import { Star } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";

export interface FeaturedProductsProps {
  heading: string;
  products: Product[];
  viewAllHref: string;
  viewAllLabel?: string;
}

/**
 * Marketing section that renders a labelled product grid with a "view all" link.
 */
export default function FeaturedProducts({
  heading,
  products,
  viewAllHref,
  viewAllLabel = "View all →",
}: FeaturedProductsProps) {
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          {heading}
        </h2>
        <Link
          href={viewAllHref}
          className="text-indigo-600 font-semibold hover:underline text-sm"
        >
          {viewAllLabel}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
