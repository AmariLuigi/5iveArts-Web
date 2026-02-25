import Link from "next/link";
import { Brush, Printer, Truck, ShieldCheck, Star } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { products } from "@/lib/products";

export default function HomePage() {
  const featured = products.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Art You Can{" "}
            <span className="text-indigo-300">Hold</span>
          </h1>
          <p className="text-xl text-indigo-200 mb-10 leading-relaxed">
            Hand-painted and home 3D-printed action figures — every piece
            individually crafted with passion. No two figures are exactly alike.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="bg-white text-indigo-900 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/products?category=hand-painted"
              className="border border-white/50 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Hand-Painted
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            {
              icon: <Brush className="w-7 h-7 text-purple-600 mx-auto mb-2" />,
              title: "Hand-Painted",
              text: "Each figure painted by hand with premium acrylics",
            },
            {
              icon: <Printer className="w-7 h-7 text-blue-600 mx-auto mb-2" />,
              title: "3D-Printed",
              text: "High-resolution resin prints at 0.025mm layer height",
            },
            {
              icon: <Truck className="w-7 h-7 text-green-600 mx-auto mb-2" />,
              title: "Fast Shipping",
              text: "Packlink-powered shipping to the UK and Europe",
            },
            {
              icon: <ShieldCheck className="w-7 h-7 text-indigo-600 mx-auto mb-2" />,
              title: "Secure Checkout",
              text: "Payments handled safely by Stripe",
            },
          ].map((f) => (
            <div key={f.title} className="p-4">
              {f.icon}
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            Featured Figures
          </h2>
          <Link
            href="/products"
            className="text-indigo-600 font-semibold hover:underline text-sm"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-50 border-t border-indigo-100 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-indigo-900 mb-4">
          Ready to own a piece of art?
        </h2>
        <p className="text-indigo-600 mb-8 max-w-xl mx-auto">
          Browse the full collection of hand-painted and 3D-printed action
          figures. Each one is made to order with care.
        </p>
        <Link
          href="/products"
          className="bg-indigo-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
        >
          Browse the Shop
        </Link>
      </section>
    </div>
  );
}
