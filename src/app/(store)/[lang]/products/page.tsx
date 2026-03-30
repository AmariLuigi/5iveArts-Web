export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import { fetchProductsFromDb } from "@/lib/products";
import { getDictionary, Locale, locales } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null) as any;
  
  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    title: `${dict?.nav?.products || 'Shop'} — 5iveArts Action Figures`,
    description: dict?.products?.subtitle || "Browse all hand-painted and 3D-printed action figures from 5iveArts.",
    alternates: {
      canonical: `/${lang}/products`,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/products`])
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
