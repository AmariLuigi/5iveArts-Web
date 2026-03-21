"use client";

import { type ReactNode } from "react";
import { motion, Variants } from "framer-motion";

export interface Feature {
  icon: ReactNode;
  title: string;
  text: string;
}

export interface FeaturesSectionProps {
  features: Feature[];
}

export default function FeaturesSection({ features }: FeaturesSectionProps) {
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
    <section className="py-24 px-4 bg-[#050505] border-b border-[#111] overflow-hidden">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12"
      >
        {features.map((f) => (
          <motion.div 
            key={f.title} 
            variants={itemVariants}
            className="flex flex-col items-center md:items-start text-center md:text-left group"
          >
            <div className="mb-6 p-4 bg-[#111] rounded-2xl border border-white/5 group-hover:border-brand-yellow/30 transition-all duration-500 group-hover:-translate-y-2">
              <div className="transform transition-transform duration-500 group-hover:scale-110">
                {f.icon}
              </div>
            </div>
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-2 group-hover:text-brand-yellow transition-colors">{f.title}</h3>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">{f.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
