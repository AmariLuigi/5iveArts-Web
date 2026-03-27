"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/products";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function MiniCart({ dict, lang }: { dict: any, lang: string }) {
    const items = useCartStore((state) => state.items);
    const removeItem = useCartStore((state) => state.removeItem);
    const subtotal = useCartStore((state) => state.subtotal)();
    const { track } = useAnalytics();

    const handleRemove = (item: typeof items[0]) => {
        track("remove_from_cart", {
            product_id: item.product.id,
            product_name: item.product.name,
            variant_scale: item.selectedScale,
            variant_finish: item.selectedFinish,
            price: item.priceAtSelection,
            quantity: item.quantity,
            source: "mini_cart",
        });
        removeItem(item.product.id, item.selectedScale, item.selectedFinish);
    };

    if (items.length === 0) {
        return (
            <div className="p-8 text-center bg-[#050505] border border-white/5 rounded-sm shadow-2xl backdrop-blur-xl w-80">
                <ShoppingBag className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
                <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500">
                    {dict.cart.empty}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#050505] border border-white/5 rounded-sm shadow-2xl backdrop-blur-xl w-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-yellow">
                    {dict.cart.title} ({items.length})
                </h3>
            </div>

            {/* Items List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedScale}-${item.selectedFinish}`} className="p-4 flex gap-4 border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group relative">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-neutral-900 border border-white/5 overflow-hidden">
                            <Image
                                src={item.product.images[0]}
                                alt={(item.product as any)[`name_${lang}`] || item.product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                sizes="64px"
                            />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-[11px] font-black uppercase text-white truncate tracking-tight pr-6">
                                {(item.product as any)[`name_${lang}`] || item.product.name}
                            </h4>
                            <div className="text-[9px] uppercase font-bold text-neutral-500 flex gap-2 mt-1 tracking-widest items-center">
                                <span>{item.selectedScale}</span>
                                <span className="opacity-30">•</span>
                                <span>{item.selectedFinish === 'painted' ? dict.products.painted : dict.products.raw}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                    {item.quantity} × {formatPrice(item.priceAtSelection)}
                                </span>
                                <span className="text-xs font-black text-white tracking-tighter">
                                    {formatPrice(item.priceAtSelection * item.quantity)}
                                </span>
                            </div>
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={() => handleRemove(item)}
                            className="absolute top-4 right-4 text-neutral-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Remove item"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">{dict.cart.subtotal}</span>
                    <span className="text-xl font-black text-brand-yellow tracking-tighter">{formatPrice(subtotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href={`/${lang}/cart`}
                        className="flex items-center justify-center p-3 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all"
                    >
                        {dict.cart.title}
                    </Link>
                    <Link
                        href={`/${lang}/checkout`}
                        className="flex items-center justify-center p-3 bg-brand-yellow text-black text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all gap-2"
                    >
                        {dict.cart.checkout} <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
