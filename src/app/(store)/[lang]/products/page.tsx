export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import { fetchProductsFromDb } from "@/lib/products";
import { getDictionary, Locale, locales } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

export async function generateMetadata({ 
  params,
  searchParams,
}: { 
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await params;
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams?.category as string | undefined;
  
  const dict = await getDictionary(lang as Locale).catch(() => null) as any;
  const queryString = category ? `?category=${encodeURIComponent(category)}` : "";
  const canonicalPath = `/${lang}/products${queryString}`;
  
  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    title: category ? `${category} Action Figures — 5iveArts` : `${dict?.nav?.products || 'Shop'} — 5iveArts Action Figures`,
    description: dict?.products?.subtitle || "Browse all hand-painted and 3D-printed action figures from 5iveArts.",
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/products${queryString}`])
      ),
    },
  };
}

async function ProductsList({ lang, dict }: { lang: string, dict: any }) {
  const products = await fetchProductsFromDb();
  return <ProductsClient initialProducts={products} dict={dict} lang={lang} />;
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  
  if (!dict) notFound();

  return (
    <Suspense fallback={<div className="p-32 text-center text-[10px] uppercase font-black tracking-[0.4em] text-neutral-800 animate-pulse">Initializing Collection…</div>}>
      <ProductsList lang={lang} dict={dict} />
    </Suspense>
  );
}
