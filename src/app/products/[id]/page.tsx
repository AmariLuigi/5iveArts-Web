import { notFound } from "next/navigation";
import { fetchProductsFromDb, getProductById } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const products = await fetchProductsFromDb();
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const products = await fetchProductsFromDb();
  const product = products.find(p => p.id === id);
  if (!product) return {};
  return {
    title: `${product.name} — 5iveArts`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const products = await fetchProductsFromDb();
  const product = products.find(p => p.id === id);
  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
