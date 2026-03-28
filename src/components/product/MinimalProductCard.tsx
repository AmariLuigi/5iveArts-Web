"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Product } from "@/types";
import WishlistToggle from "@/components/ui/WishlistToggle";

interface MinimalProductCardProps {
  product: Product;
  lang?: string;
  dict?: any;
}

export default function MinimalProductCard({ product, lang = "en", dict }: MinimalProductCardProps) {
  const currentImage = product.images?.[0] || "/images/placeholder.jpg";
  const localizedName = (product as any)[`name_${lang}`] || product.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden hover:border-brand-yellow/30 transition-all duration-500"
    >
      <Link href={`/${lang}/products/${product.id}`} className="relative aspect-square overflow-hidden bg-neutral-900 border-b border-white/5">
        <Image
          src={currentImage}
          alt={localizedName}
          fill
          className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
        />
        
        {/* Rapid Selection Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
             {dict?.products_ui?.inspect || "Inspect Artifact"}
           </span>
        </div>
      </Link>

      <div className="p-4 flex items-center justify-between gap-4">
        <Link 
          href={`/${lang}/products/${product.id}`}
          className="text-[10px] font-black uppercase tracking-widest text-white hover:text-brand-yellow transition-colors truncate"
        >
          {localizedName}
        </Link>
        <WishlistToggle 
          productId={product.id} 
          productName={localizedName}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10" 
        />
      </div>
    </motion.div>
  );
}
