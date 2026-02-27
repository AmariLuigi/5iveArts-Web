"use client";

import Link from "next/link";
import { ShoppingBag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { useCartStore } from "@/store/cart";
import CartItemRow from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/products";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal)();
  const clearCart = useCartStore((state) => state.clearCart);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-neutral-800 mx-auto mb-6" />
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">
          Empty Arsenal
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-10">
          Looks like you haven&apos;t added any figures yet.
        </p>
        <Link
          href="/products"
          className="hasbro-btn-primary px-10 py-4 font-black text-xs uppercase tracking-widest inline-block shadow-2xl shadow-brand-yellow/10"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[70vh]">
      <div className="flex items-end justify-between mb-8 pb-8 border-b border-white/5">
        <div>
          <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">Checkout flow</span>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">Your Cart</h1>
        </div>
        <button
          onClick={clearCart}
          className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-red-500 transition-colors"
        >
          Clear cart
        </button>
      </div>

      {/* Trust row */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-12 py-4 border-y border-white/5">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-yellow" />
          Secure Checkout
        </span>
        <span className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-yellow" />
          Insured Global Shipping
        </span>
        <span className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-brand-yellow" />
          30-Day Returns
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="hasbro-card p-0 overflow-hidden">
            {items.map((item, idx) => (
              <div key={`${item.product.id}-${item.selectedScale}-${item.selectedFinish}`} className={idx !== 0 ? "border-t border-white/5" : ""}>
                <CartItemRow item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="hasbro-card p-8 h-fit sticky top-24">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8">
            Order Summary
          </h2>
          <div className="space-y-6 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-white/30 italic">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex justify-between font-black text-white">
            <span className="uppercase tracking-widest text-xs">Estimated Total</span>
            <span className="text-brand-yellow text-xl tracking-tighter">{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="hasbro-btn-primary mt-10 w-full py-5 text-sm flex items-center justify-center shadow-2xl shadow-brand-yellow/10"
          >
            Proceed to Checkout →
          </Link>
          <Link
            href="/products"
            className="mt-6 w-full text-center text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-colors block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
