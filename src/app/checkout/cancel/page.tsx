"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-24">
      <div className="max-w-xl w-full text-center">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/10">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
          Transaction Aborted
        </h1>
        <p className="text-neutral-500 text-[11px] uppercase tracking-[0.2em] font-black mb-12 max-w-sm mx-auto leading-relaxed">
          The secure payment gateway connection was closed. Your order has not been placed, but your cart items are reserved and waiting.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/checkout"
            className="hasbro-btn-primary w-full sm:w-auto px-10 py-5 text-[11px] flex items-center justify-center gap-3 uppercase font-black"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </Link>
          <Link
            href="/cart"
            className="w-full sm:w-auto border border-white/5 bg-[#0a0a0a] text-neutral-400 font-black px-10 py-5 rounded text-[11px] hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-3 uppercase"
          >
            <ShoppingCart className="w-4 h-4" />
            View Cart
          </Link>
        </div>

        <p className="mt-16 text-[9px] text-neutral-600 font-black uppercase tracking-[0.3em]">
          5iveArts — Secure Collection Protocol
        </p>
      </div>
    </div>
  );
}
