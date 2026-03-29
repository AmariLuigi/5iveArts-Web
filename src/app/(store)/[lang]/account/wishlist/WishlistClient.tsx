"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { WishlistItem } from "@/types";
import { Loader2, Heart, Search } from "lucide-react";
import MinimalProductCard from "@/components/product/MinimalProductCard";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistStore } from "@/store/wishlist";
import { createClient } from "@/lib/supabase-browser";

interface WishlistClientProps {
    lang: string;
    dict: any;
}

export default function WishlistClient({ lang, dict }: WishlistClientProps) {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { itemIds } = useWishlistStore();

    useEffect(() => {
        fetchWishlist();
    }, [itemIds.length]);

    const fetchWishlist = async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get("/api/account/wishlist");
            setWishlist(res.data);
        } catch (err) {
            console.error("Failed to fetch wishlist:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Hydrating Vault Records...</p>
            </div>
        );
    }

    if (wishlist.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/5 p-20 text-center rounded-sm max-w-2xl mx-auto"
            >
                <div className="relative inline-block mb-10">
                    <Heart className="w-20 h-20 text-white/5" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-8 h-8 text-brand-yellow/30" />
                    </div>
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-4">
                    {dict.account?.wishlist?.emptyTitle || "Your Wishlist is Empty"}
                </h2>
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest leading-relaxed mb-12 max-w-md mx-auto">
                    {dict.account?.wishlist?.emptyDescription || "Scout our artifacts and bookmark those that resonate with your curator style for future acquisition."}
                </p>
                <Link 
                    href={`/${lang}/products`}
                    className="inline-flex items-center gap-4 hasbro-btn-primary px-10 py-5 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-brand-yellow/10"
                >
                    Explore Artifacts
                </Link>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
                {wishlist.map((item) => (
                    item.product && (
                        <MinimalProductCard 
                            key={item.product_id}
                            product={item.product}
                            lang={lang}
                            dict={dict}
                        />
                    )
                ))}
            </AnimatePresence>
        </div>
    );
}
