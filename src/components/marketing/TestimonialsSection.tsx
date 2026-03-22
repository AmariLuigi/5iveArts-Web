"use client";

import { Star } from "lucide-react";
import { motion, Variants } from "framer-motion";

export interface Testimonial {
  name: string;
  role?: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar?: string;
}

export interface TestimonialsSectionProps {
  heading?: string;
  testimonials: Testimonial[];
}

export default function TestimonialsSection({
  heading = "What collectors are saying",
  testimonials,
}: TestimonialsSectionProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-24 px-4 bg-[#000000] border-b border-[#111] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">Collector Reviews</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
            {heading}
          </h2>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="hasbro-card p-8 flex flex-col gap-6 group hover:translate-y-[-8px] transition-transform duration-500 shadow-2xl hover:shadow-brand-yellow/5"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < t.rating
                        ? "text-brand-yellow fill-brand-yellow"
                        : "text-white/10 fill-white/10"
                      }`}
                  />
                ))}
              </div>
              <p className="text-white font-medium text-sm leading-[1.6]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-4 pt-6 border-t border-white/5">
                <div className="w-10 h-10 bg-brand-yellow/10 rounded-full overflow-hidden flex items-center justify-center text-brand-yellow font-black text-xs group-hover:scale-110 transition-transform">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    t.name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight text-white text-sm">{t.name}</p>
                  {t.role && (
                    <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">{t.role}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
