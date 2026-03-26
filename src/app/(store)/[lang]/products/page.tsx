export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import { fetchProductsFromDb } from "@/lib/products";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Shop — 5iveArts Action Figures",
  description:
    "Browse all hand-painted and 3D-printed action figures from 5iveArts. Each figure is unique and crafted with care.",
};

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
