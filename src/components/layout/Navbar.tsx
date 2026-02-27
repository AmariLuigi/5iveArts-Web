"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, Palette, ChevronDown } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState, useEffect, useRef } from "react";
import MiniCart from "@/components/cart/MiniCart";

export default function Navbar() {
  const items = useCartStore((state) => state.items);
  const cartTotal = items.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsCartHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsCartHovered(false);
    }, 300);
  };

  const totalItems = mounted ? cartTotal : 0;

  return (
    <header className="sticky top-0 z-50 bg-[#000000] border-b border-[#222] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-black text-2xl uppercase tracking-tighter text-white">
            <Palette className="w-6 h-6 text-brand-yellow" />
            5ive<span className="text-brand-yellow">Arts</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-white">
            <Link href="/" className="hover:text-brand-yellow transition-colors duration-200">
              Home
            </Link>
            <Link href="/products" className="hover:text-brand-yellow transition-colors duration-200">
              The Collection
            </Link>
          </nav>

          {/* Cart + mobile menu */}
          <div className="flex items-center gap-4">
            <div
              className="relative hidden md:block"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/cart"
                className="flex items-center gap-1 text-white hover:text-brand-yellow transition-all duration-200 py-4"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-yellow text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                      {totalItems}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isCartHovered ? 'rotate-180 text-brand-yellow' : 'text-neutral-600'}`} />
              </Link>

              {/* Mini Cart Dropdown */}
              {isCartHovered && (
                <div className="absolute right-0 top-full pt-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                  <MiniCart />
                </div>
              )}
            </div>

            {/* Mobile Cart Icon (Always visible on mobile, no hover) */}
            <Link
              href="/cart"
              className="md:hidden relative flex items-center gap-1 text-white hover:text-brand-yellow transition-all duration-200"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-yellow text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              className="md:hidden text-white"
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
        <nav className="md:hidden bg-[#111] border-t border-[#222] px-4 py-8 flex flex-col gap-6 text-xs font-bold uppercase tracking-widest text-white">
          <Link href="/" onClick={() => setMenuOpen(false)} className="hover:text-brand-yellow">Home</Link>
          <Link href="/products" onClick={() => setMenuOpen(false)} className="hover:text-brand-yellow">The Collection</Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)} className="hover:text-brand-yellow">Cart ({totalItems})</Link>
        </nav>
      )}
    </header>
  );
}
