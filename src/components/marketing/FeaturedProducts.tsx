"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";

export interface FeaturedProductsProps {
  heading: string;
  products: Product[];
  viewAllHref: string;
  viewAllLabel?: string;
}

export default function FeaturedProducts({
  heading,
  products,
  viewAllHref,
  viewAllLabel = "View all →",
}: FeaturedProductsProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      variants={containerVariants}
      className="py-24 px-4 max-w-7xl mx-auto overflow-hidden"
    >
      <div className="flex items-end justify-between mb-12 border-b border-white/5 pb-8">
        <div>
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-yellow mb-2 block">Collector's Choice</span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
            {heading}
          </h2>
        </div>
        <Link
          href={viewAllHref}
          className="text-white/40 hover:text-brand-yellow font-black uppercase tracking-widest text-[10px] transition-colors"
        >
          {viewAllLabel}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <motion.div key={product.id} variants={itemVariants}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
