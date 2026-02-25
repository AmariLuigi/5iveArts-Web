import { Suspense } from "react";
import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "Shop — 5iveArts Action Figures",
  description:
    "Browse all hand-painted and 3D-printed action figures from 5iveArts. Each figure is unique and crafted with care.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-gray-400">Loading products…</div>}>
      <ProductsClient />
    </Suspense>
  );
}
