"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { useCartStore } from "@/store/cart";
import CartItemRow from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/products";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function CartClient({ 
  dict, 
  lang, 
  freeShippingThreshold 
}: { 
  dict: any; 
  lang: string; 
  freeShippingThreshold: number;
}) {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal)();
  
  const formattedThreshold = formatPrice(freeShippingThreshold);
  const isFreeEligible = subtotal >= freeShippingThreshold;
  const remainingForFree = freeShippingThreshold - subtotal;
  const clearCart = useCartStore((state) => state.clearCart);
  const { track } = useAnalytics();

  // Track cart_viewed once on mount
  useEffect(() => {
    track("cart_viewed", {
      cart_total: subtotal,
      item_count: items.length,
      free_shipping_eligible: isFreeEligible,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-neutral-800 mx-auto mb-6" />
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">
          {dict.cart.emptyArsenal}
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-10">
          {dict.cart.emptyMessage}
        </p>
        <Link
          href={`/${lang}/products`}
          className="hasbro-btn-primary px-10 py-4 font-black text-xs uppercase tracking-widest inline-block shadow-2xl shadow-brand-yellow/10"
        >
          {dict.cart.returnToShop}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[70vh]">
      <div className="flex items-end justify-between mb-8 pb-8 border-b border-white/5">
        <div>
          <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">{dict.cart.checkoutFlow}</span>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">{dict.cart.yourCart}</h1>
        </div>
        <button
          onClick={clearCart}
          className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-red-500 transition-colors"
        >
          {dict.cart.clearCart}
        </button>
      </div>

      {/* Trust row */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-12 py-4 border-y border-white/5">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-yellow" />
          {dict.cart.secureCheckout}
        </span>
        <span className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-yellow" />
          {dict.cart.insuredShipping}
        </span>
        <span className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-brand-yellow" />
          {dict.cart.thirtyDayReturns}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="hasbro-card p-0 overflow-hidden">
            {items.map((item, idx) => (
              <div key={`${item.product.id}-${item.selectedScale}-${item.selectedFinish}`} className={idx !== 0 ? "border-t border-white/5" : ""}>
                <CartItemRow 
                  item={item} 
                  lang={lang}
                  dict={dict}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="hasbro-card p-8 h-fit sticky top-24">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8">
            {dict.cart.orderSummary}
          </h2>

          {/* Free Shipping Progress */}
          {freeShippingThreshold > 0 && (
            <div className="mb-8 p-4 bg-white/[0.03] border border-white/5 rounded-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-yellow">
                        {isFreeEligible ? dict.cart.insuredShipping : dict.cart.freeShipping.replace("{amount}", formattedThreshold)}
                    </span>
                    {!isFreeEligible && (
                        <span className="text-[9px] font-black uppercase text-white/40">
                            -{formatPrice(remainingForFree)}
                        </span>
                    )}
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-brand-yellow transition-all duration-700 ease-out"
                        style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                    />
                </div>
            </div>
          )}
          <div className="space-y-6 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            <div className="flex justify-between">
              <span>{dict.cart.subtotal}</span>
              <span className="text-white">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{dict.cart.shipping}</span>
              <span className="text-white/30 italic">{dict.cart.calculatedAtCheckout}</span>
            </div>
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex justify-between font-black text-white">
            <span className="uppercase tracking-widest text-xs">{dict.cart.estimatedTotal}</span>
            <span className="text-brand-yellow text-xl tracking-tighter">{formatPrice(subtotal)}</span>
          </div>
          <Link
            href={`/${lang}/checkout`}
            className="hasbro-btn-primary mt-10 w-full py-5 text-sm flex items-center justify-center shadow-2xl shadow-brand-yellow/10"
          >
            {dict.cart.proceedToCheckout} →
          </Link>
          <Link
            href={`/${lang}/products`}
            className="mt-6 w-full text-center text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-colors block"
          >
            {dict.cart.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  );
}
