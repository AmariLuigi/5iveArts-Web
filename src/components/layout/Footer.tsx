import Link from "next/link";
import { Palette } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Palette className="w-5 h-5 text-indigo-400" />
              5iveArts
            </div>
            <p className="text-sm leading-relaxed">
              Unique hand-painted and home 3D-printed action figures, crafted
              with passion. Every piece is a one-of-a-kind work of art.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=hand-painted" className="hover:text-white transition-colors">
                  Hand-Painted Figures
                </Link>
              </li>
              <li>
                <Link href="/products?category=home-printed" className="hover:text-white transition-colors">
                  3D-Printed Figures
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Information</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About 5iveArts
                </Link>
              </li>
              <li>
                <span className="text-gray-500">hello@5ivearts.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-xs text-center text-gray-500">
          © {new Date().getFullYear()} 5iveArts. All rights reserved. Payments
          secured by Stripe. Shipping powered by Packlink.
        </div>
      </div>
    </footer>
  );
}
