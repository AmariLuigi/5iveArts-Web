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

import { getDictionary, Locale } from "@/lib/get-dictionary";
import ProductSchema from "@/components/seo/ProductSchema";

export async function generateMetadata({ params }: Props) {
  const { id, lang } = await params;
  const products = await fetchProductsFromDb();
  const product = products.find(p => p.id === id);
  if (!product) return {};
  
  return {
    title: `${product.name} — 5iveArts`,
    description: product.description,
    openGraph: {
      type: 'website', // Use website since it's a detail page
      title: `${product.name} | 5iveArts`,
      description: product.description,
      url: `https://5ivearts.com/${lang}/products/${product.id}`,
      images: [
        {
          url: product.images?.[0] || '/logo.svg',
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | 5iveArts`,
      description: product.description,
      images: [product.images?.[0] || '/logo.svg'],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id, lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  
  if (!dict) notFound();

  const products = await fetchProductsFromDb();
  const product = products.find(p => p.id === id);
  if (!product) notFound();

  return (
    <>
      <ProductSchema product={product} lang={lang} />
      <ProductDetailClient product={product} lang={lang} dict={dict} />
    </>
  );
}

