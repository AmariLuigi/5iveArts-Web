import Link from "next/link";
import { Palette } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#000000] text-[#555] mt-24 border-t border-[#222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white font-black text-2xl mb-6 uppercase tracking-tighter">
              <Palette className="w-6 h-6 text-brand-yellow" />
              5ive<span className="text-brand-yellow">Arts</span>
            </div>
            <p className="text-xs font-medium leading-relaxed max-w-xs">
              Hand-painted and home 3D-printed masterpieces. Individually crafted with passion for serious collectors.
            </p>
          </div>

          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Shop</h3>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-wider">
              <li>
                <Link href="/products" className="hover:text-brand-yellow transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=hand-painted" className="hover:text-brand-yellow transition-colors">
                  Hand-Painted
                </Link>
              </li>
              <li>
                <Link href="/products?category=home-printed" className="hover:text-brand-yellow transition-colors">
                  3D-Printed
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Support</h3>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-wider">
              <li>
                <Link href="/faq" className="hover:text-brand-yellow transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-brand-yellow transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Connect</h3>
            <p className="text-[11px] font-bold tracking-wider text-neutral-500 mb-2">Customer Service:</p>
            <span className="text-white font-black text-sm tracking-tight">hello@5ivearts.com</span>
          </div>
        </div>

        <div className="border-t border-white/5 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase font-black tracking-widest text-neutral-600">
          <div>© {new Date().getFullYear()} 5iveArts Collector Series.</div>
          <div className="flex gap-6">
            <span>Stripe Secure Payments</span>
            <span>Insured Global Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
