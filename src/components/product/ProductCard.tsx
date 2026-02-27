"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Tag, Star, Play } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/products";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isHovered, setIsHovered] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  // Media logic: 
  // - Default: show first image
  // - Hover: 
  //    - If video exists, play first video
  //    - Else if multiple images exist, cycle through them
  const hasVideo = product.videos && product.videos.length > 0;
  const hasMultipleImages = product.images && product.images.length > 1;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && !hasVideo && hasMultipleImages) {
      // Instant jump to second image for immediate feedback
      setMediaIndex(1);

      interval = setInterval(() => {
        setMediaIndex((prev) => (prev + 1) % (product.images?.length || 1));
      }, 1500); // Subsequent swaps every 1.5s
    } else {
      setMediaIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, hasVideo, hasMultipleImages, product.images?.length]);

  const currentImage = product.images?.[mediaIndex] || "/images/placeholder.jpg";
  const displayVideo = hasVideo && isHovered;
  const videoUrl = product.videos?.[0];
  const categoryLabel = "Premium Figurine";

  return (
    <div
      className="hasbro-card group flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Display */}
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/5] bg-neutral-900 overflow-hidden border-b border-white/5">
        {displayVideo ? (
          <video
            key={videoUrl}
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        ) : (
          <Image
            src={currentImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {/* Media indicator dots (only for images) */}
        {!hasVideo && hasMultipleImages && isHovered && (
          <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
            {product.images.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === mediaIndex ? "bg-brand-yellow w-4" : "bg-white/20"}`}
              />
            ))}
          </div>
        )}

        {hasVideo && !isHovered && (
          <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Play className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
          </div>
        )}

        {/* Category badge */}
        <span className="absolute top-4 left-4 hasbro-tag flex items-center gap-1 shadow-lg">
          <Tag className="w-3 h-3" />
          {categoryLabel}
        </span>

        {product.stock <= 3 && product.stock > 0 && (
          <span className="absolute bottom-4 left-4 bg-brand-orange text-white text-[10px] uppercase font-black px-2 py-1 rounded-sm shadow-xl">
            Only {product.stock} left!
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-black uppercase tracking-widest text-sm">
            Sold Out
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
        <div className="mb-2">
          {/* Star rating */}
          {product.rating && (
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${i < Math.round(product.rating!)
                    ? "text-brand-yellow fill-brand-yellow"
                    : "text-white/10 fill-white/10"
                    }`}
                />
              ))}
            </div>
          )}
          <Link href={`/products/${product.id}`} className="text-xl font-black uppercase tracking-tight text-white hover:text-brand-yellow transition-colors leading-none block">
            {product.name}
          </Link>
        </div>

        <p className="text-sm text-neutral-500 line-clamp-2 flex-1 font-medium mb-6">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1 leading-none uppercase">Starting from</span>
            <span className="text-2xl font-black text-white leading-none tracking-tighter">
              {formatPrice(product.price)}
            </span>
          </div>
          <button
            onClick={() => addItem(product, "1/12", "painted", product.price)}
            disabled={product.stock === 0}
            className="hasbro-btn-primary p-3 shadow-lg shadow-brand-yellow/10"
            title="Add default 1:12 Painted to cart"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
