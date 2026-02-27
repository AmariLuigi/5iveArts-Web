import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import { fetchProductsFromDb } from "@/lib/products";

export const metadata = {
  title: "Shop — 5iveArts Action Figures",
  description:
    "Browse all hand-painted and 3D-printed action figures from 5iveArts. Each figure is unique and crafted with care.",
};

async function ProductsList() {
  const products = await fetchProductsFromDb();
  return <ProductsClient initialProducts={products} />;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-32 text-center text-[10px] uppercase font-black tracking-[0.4em] text-neutral-800 animate-pulse">Initializing Collection…</div>}>
      <ProductsList />
    </Suspense>
  );
}
