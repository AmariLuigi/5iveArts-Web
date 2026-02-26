import { notFound } from "next/navigation";
import Image from "next/image";
import { products, getProductById, formatPrice } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";
import TrustBadges from "@/components/ui/TrustBadges";
import { CheckCircle, Tag, Star, ShieldCheck, Truck } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return {};
  return {
    title: `${product.name} — 5iveArts`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const categoryLabel =
    product.category === "hand-painted" ? "Hand-Painted" : "3D-Printed";
  const categoryColor =
    product.category === "hand-painted"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            onError={undefined}
          />
          <span
            className={`absolute top-4 left-4 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${categoryColor}`}
          >
            <Tag className="w-3.5 h-3.5" />
            {categoryLabel}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {product.name}
          </h1>
          <p className="text-3xl font-bold text-indigo-700 mb-3">
            {formatPrice(product.price)}
          </p>

          {/* Star rating */}
          {product.rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating!)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {product.rating.toFixed(1)}
              </span>
              {product.reviewCount && (
                <span className="text-sm text-gray-400">
                  ({product.reviewCount} reviews)
                </span>
              )}
            </div>
          )}
          <p className="text-gray-600 leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Details list */}
          <ul className="space-y-2 mb-8">
            {product.details.map((detail) => (
              <li key={detail} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                {detail}
              </li>
            ))}
          </ul>

          {/* Stock */}
          {(() => {
            const LOW_STOCK_THRESHOLD = 3;
            const URGENCY_BAR_MAX = 10; // 100% bar represents 10 units
            if (product.stock === 0) {
              return <p className="text-red-500 font-semibold mb-4">Out of stock</p>;
            }
            if (product.stock <= LOW_STOCK_THRESHOLD) {
              return (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-orange-600 font-bold animate-pulse">
                      🔥 Only {product.stock} left — selling fast!
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${(product.stock / URGENCY_BAR_MAX) * 100}%` }}
                    />
                  </div>
                </div>
              );
            }
            return (
              <p className="flex items-center gap-1.5 text-green-600 font-semibold mb-4">
                <ShieldCheck className="w-4 h-4" />
                In stock — ready to ship
              </p>
            );
          })()}

          <AddToCartButton product={product} />

          {/* Inline trust badges */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>Secure payment — your data is safe with Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Free UK shipping · Tracked Packlink delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full trust badge grid below the main layout */}
      <TrustBadges className="mt-10 pt-8 border-t border-gray-100" />
    </div>
  );
}
