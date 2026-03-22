"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Tag, Star, Play, ChevronUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, ProductScale, ProductFinish } from "@/types";
import { formatPrice, calculatePrice, SCALE_CONFIG } from "@/lib/products";
import { useCartStore } from "@/store/cart";
import { useSiteSettings } from "@/components/providers/SettingsProvider";

interface ProductCardProps {
  product: Product;
  lang?: string;
  dict?: any;
}

export default function ProductCard({ product, lang = "en", dict }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { pricing } = useSiteSettings();
  const [isHovered, setIsHovered] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showScaleSelector, setShowScaleSelector] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const hasVideo = product.videos && product.videos.length > 0;
  const hasMultipleImages = product.images && product.images.length > 1;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && !hasVideo && hasMultipleImages && !showScaleSelector) {
      setMediaIndex(1);
      interval = setInterval(() => {
        setMediaIndex((prev) => (prev + 1) % (product.images?.length || 1));
      }, 1500);
    } else {
      setMediaIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, hasVideo, hasMultipleImages, product.images?.length, showScaleSelector]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setShowScaleSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentImage = product.images?.[mediaIndex] || "/images/placeholder.jpg";
  const displayVideo = hasVideo && isHovered && !showScaleSelector;
  const videoUrl = product.videos?.[0];
  const categoryLabel = dict?.homepage?.premiumSeries || "Premium Series";

  const scales: ProductScale[] = ["1/9", "1/6", "1/4"];

  const handleAddItem = (scale: ProductScale, finish: ProductFinish) => {
    const price = calculatePrice(product.price, scale, finish, pricing);
    setIsAdding(true);

    // Add item to cart
    addItem(product, scale, finish, price);

    // Show success feedback
    setTimeout(() => {
      setIsAdding(false);
      setShowAddedFeedback(true);
      setShowScaleSelector(false);

      // Hide feedback after delay
      setTimeout(() => {
        setShowAddedFeedback(false);
      }, 2000);
    }, 300);
  };

  return (
    <motion.div
      className="hasbro-card group flex flex-col h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <Link href={`/${lang}/products/${product.id}`} className="relative block aspect-[4/5] bg-neutral-900 overflow-hidden border-b border-white/5">
        {/* Shimmer overlay on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100"
          animate={isHovered ? { x: ["-100%", "100%"] } : { x: "-100%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 60%, transparent 80%)",
          }}
        />

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
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-108"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {!hasVideo && hasMultipleImages && isHovered && !showScaleSelector && (
          <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
            {product.images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === mediaIndex ? "bg-brand-yellow w-4" : "bg-white/20"}`}
              />
            ))}
          </div>
        )}

        {hasVideo && !isHovered && (
          <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Play className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
          </div>
        )}

        <span className="absolute top-4 left-4 hasbro-tag flex items-center gap-1 shadow-lg">
          <Tag className="w-3 h-3" />
          {categoryLabel}
        </span>
      </Link>

      <div className="p-6 flex flex-col flex-1 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
        <div className="mb-2">
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

          <div className="flex flex-wrap gap-2 mb-2">
            {product.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="text-[8px] uppercase font-bold text-neutral-600 tracking-widest bg-white/[0.03] px-2 py-0.5 rounded-sm border border-white/[0.02]">
                {tag}
              </span>
            ))}
          </div>

          <Link href={`/${lang}/products/${product.id}`} className="text-xl font-black uppercase tracking-tight text-white hover:text-brand-yellow transition-colors leading-none block">
            {product.name}
          </Link>
        </div>

        <p className="text-sm text-neutral-500 line-clamp-2 flex-1 font-medium mb-6">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative">
          <motion.div
            className="flex flex-col"
            animate={showAddedFeedback ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <span className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-1 leading-none uppercase">{dict?.products?.startingFrom || "Starting from"}</span>
            <span className="text-2xl font-black text-white leading-none tracking-tighter">
              {formatPrice(calculatePrice(product.price, "1/9", "raw", pricing))}
            </span>
          </motion.div>

          <div className="relative" ref={selectorRef}>
            <AnimatePresence mode="wait">
              {showScaleSelector ? (
                <motion.div
                  key="selector"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="absolute bottom-full right-0 mb-4 w-72 bg-[#0c0c0c] border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <span className="text-[9px] uppercase font-black tracking-widest text-brand-yellow">{dict?.products?.deploymentConfig || "Deployment Config"}</span>
                    <span className="text-[8px] font-bold text-neutral-600 uppercase">{dict?.products?.selectPrototype || "Select Prototype & Finish"}</span>
                  </div>
                  <div className="flex flex-col max-h-80 overflow-y-auto">
                    {scales.map((scale) => (
                      <motion.div
                        key={scale}
                        className="p-4 border-b border-white/5 last:border-0 border-solid"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: scales.indexOf(scale) * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{scale} Scale</span>
                          <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">Approx. {SCALE_CONFIG[scale].size}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <motion.button
                            onClick={() => handleAddItem(scale, "painted")}
                            className="flex flex-col p-2 bg-white/[0.03] border border-white/5 hover:border-brand-yellow/30 hover:bg-brand-yellow/[0.02] transition-all rounded-sm group/btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-[7px] uppercase font-black text-neutral-600 group-hover/btn:text-brand-yellow transition-colors mb-1">{dict?.products?.painted || "Painted"}</span>
                            <span className="text-[10px] font-black text-white">{formatPrice(calculatePrice(product.price, scale, "painted", pricing))}</span>
                          </motion.button>
                          <motion.button
                            onClick={() => handleAddItem(scale, "raw")}
                            className="flex flex-col p-2 bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all rounded-sm group/btn"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="text-[7px] uppercase font-black text-neutral-600 group-hover/btn:text-white transition-colors mb-1">{dict?.products?.raw || "Raw Resin"}</span>
                            <span className="text-[10px] font-black text-white">{formatPrice(calculatePrice(product.price, scale, "raw", pricing))}</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : showAddedFeedback ? (
                <motion.button
                  key="added"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="hasbro-btn-primary p-3 shadow-lg shadow-brand-yellow/10 bg-green-600 hover:bg-green-500"
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.button>
              ) : (
                <motion.button
                  key="cart"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => setShowScaleSelector(!showScaleSelector)}
                  className={`hasbro-btn-primary p-3 shadow-lg shadow-brand-yellow/10 transition-all ${showScaleSelector ? 'bg-white text-black' : ''}`}
                  whileTap={{ scale: 0.95 }}
                >
                  {isAdding ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </motion.div>
                  ) : showScaleSelector ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
