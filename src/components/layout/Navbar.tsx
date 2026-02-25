"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, Palette } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

export default function Navbar() {
  const totalItems = useCartStore((state) => state.totalItems)();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-700">
            <Palette className="w-6 h-6" />
            5iveArts
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <Link href="/products" className="hover:text-indigo-600 transition-colors">
              Shop
            </Link>
            <Link href="/products?category=hand-painted" className="hover:text-indigo-600 transition-colors">
              Hand-Painted
            </Link>
            <Link href="/products?category=home-printed" className="hover:text-indigo-600 transition-colors">
              3D Printed
            </Link>
          </nav>

          {/* Cart + mobile menu */}
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative flex items-center gap-1 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              className="md:hidden text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200 px-4 py-4 flex flex-col gap-4 text-sm font-medium text-gray-700">
          <Link href="/" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">Home</Link>
          <Link href="/products" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">Shop</Link>
          <Link href="/products?category=hand-painted" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">Hand-Painted</Link>
          <Link href="/products?category=home-printed" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">3D Printed</Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)} className="hover:text-indigo-600">Cart ({totalItems})</Link>
        </nav>
      )}
    </header>
  );
}
