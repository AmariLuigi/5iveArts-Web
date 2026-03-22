import { notFound } from "next/navigation";
import { fetchProductsFromDb } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";
import { locales } from "@/lib/get-dictionary";

interface Props {
  params: Promise<{ id: string; lang: string }>;
}

export async function generateStaticParams() {
  const products = await fetchProductsFromDb();
  const paths: { id: string; lang: string }[] = [];
  
  // Generate paths for every product in every supported language
  for (const product of products) {
    for (const lang of locales) {
      paths.push({ id: product.id, lang });
    }
  }
  
  return paths;
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

import { getDictionary, Locale } from "@/lib/get-dictionary";

export default async function ProductDetailPage({ params }: Props) {
  const { id, lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  
  if (!dict) notFound();

  const products = await fetchProductsFromDb();
  const product = products.find(p => p.id === id);
  if (!product) notFound();

  return <ProductDetailClient product={product} lang={lang} dict={dict} />;
}

