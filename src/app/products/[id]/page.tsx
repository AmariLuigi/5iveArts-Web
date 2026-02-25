import { notFound } from "next/navigation";
import Image from "next/image";
import { products, getProductById, formatPrice } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";
import { CheckCircle, Tag } from "lucide-react";

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
          <p className="text-3xl font-bold text-indigo-700 mb-4">
            {formatPrice(product.price)}
          </p>
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
          {product.stock === 0 ? (
            <p className="text-red-500 font-semibold mb-4">Out of stock</p>
          ) : product.stock <= 3 ? (
            <p className="text-orange-500 font-semibold mb-4">
              Only {product.stock} left in stock!
            </p>
          ) : (
            <p className="text-green-600 font-semibold mb-4">In stock</p>
          )}

          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
