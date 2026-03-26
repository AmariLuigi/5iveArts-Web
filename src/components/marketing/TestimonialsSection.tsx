"use client";

import { Star, CheckCircle } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

export interface Testimonial {
  name: string;
  role?: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar?: string;
}

export interface TestimonialsSectionProps {
  heading?: string;
  reviewsLabel?: string;
  testimonials: any[]; // Changed to any to allow for multilingual fields from DB
  lang?: string;
  autoRotate?: boolean;
  autoRotateInterval?: number;
}

export default function TestimonialsSection({
  heading = "What collectors are saying",
  reviewsLabel = "Collector Reviews",
  testimonials,
  lang = "en",
  autoRotate = true,
  autoRotateInterval = 5000,
}: TestimonialsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const goToNext = useCallback(() => {
    if (testimonials.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const goToPrev = useCallback(() => {
    if (testimonials.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (!autoRotate || isPaused || isHovered || testimonials.length <= 1) return;

    const interval = setInterval(goToNext, autoRotateInterval);
    return () => clearInterval(interval);
  }, [autoRotate, isPaused, isHovered, goToNext, autoRotateInterval, testimonials.length]);

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
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  // If no testimonials, show placeholder cards
  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    { name: "Alex M.", role: "Pro Collector", quote: "Absolutely stunning quality. The attention to detail is unmatched in the industry.", rating: 5 as const },
    { name: "Sarah K.", role: "Hobbyist", quote: "Finally found a source for premium collectibles. Will definitely be ordering more.", rating: 5 as const },
    { name: "Mike R.", role: "Store Owner", quote: "My customers rave about these pieces. Flying off the shelves.", rating: 5 as const },
  ];

  // For carousel mode with 3 visible
  const isCarouselMode = displayTestimonials.length > 3;
  const visibleCount = isCarouselMode ? 3 : displayTestimonials.length;

  return (
    <section
      className="py-24 px-4 bg-[#000000] border-b border-[#111] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">{reviewsLabel}</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
            {heading}
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          {isCarouselMode && (
            <>
              {/* Navigation arrows */}
              <button
                onClick={goToPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-black hover:border-brand-yellow/30 transition-all -translate-x-4 md:-translate-x-6"
                aria-label="Previous testimonial"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white hover:bg-black hover:border-brand-yellow/30 transition-all translate-x-4 md:translate-x-6"
                aria-label="Next testimonial"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCarouselMode ? 'lg:grid-cols-3' : 'lg:grid-cols-3'} gap-8 ${isCarouselMode ? 'overflow-hidden' : ''}`}>
            <AnimatePresence mode="popLayout">
              {isCarouselMode ? (
                // Carousel mode - show 3 at a time with sliding
                [0, 1, 2].map((offset) => {
                  const index = (activeIndex + offset) % displayTestimonials.length;
                  const t = displayTestimonials[index];
                  return (
                    <motion.div
                      key={`${t.name}-${index}`}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="hasbro-card p-8 flex flex-col gap-6 group hover:translate-y-[-8px] transition-transform duration-500 shadow-2xl hover:shadow-brand-yellow/5"
                      style={{ zIndex: displayTestimonials.length - offset }}
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                        <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                        <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                        <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                        <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                      </div>
                      <p className="text-white font-medium text-sm leading-[1.6]">
                        &ldquo;{(t as any)[`quote_${lang}`] || t.quote}&rdquo;
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
                            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest flex items-center gap-1">
                              {t.role}
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                              >
                                <CheckCircle className="w-3 h-3 text-brand-yellow" />
                              </motion.span>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                // Grid mode - show all
                displayTestimonials.map((t) => (
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
                      &ldquo;{(t as any)[`quote_${lang}`] || t.quote}&rdquo;
                    </p>
                    <div className="mt-auto flex items-center gap-4 pt-6 border-t border-white/5">
                      <motion.div
                        className="w-10 h-10 bg-brand-yellow/10 rounded-full overflow-hidden flex items-center justify-center text-brand-yellow font-black text-xs group-hover:scale-110 transition-transform"
                        whileHover={{ scale: 1.1 }}
                      >
                        {t.avatar ? (
                          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          t.name.charAt(0)
                        )}
                      </motion.div>
                      <div>
                        <p className="font-black uppercase tracking-tight text-white text-sm">{t.name}</p>
                        {t.role && (
                          <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest flex items-center gap-1">
                            {t.role}
                            <motion.span
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.3, type: "spring" }}
                            >
                              <CheckCircle className="w-3 h-3 text-brand-yellow" />
                            </motion.span>
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Carousel indicators */}
          {isCarouselMode && (
            <div className="flex justify-center gap-2 mt-8">
              {displayTestimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${activeIndex === i
                      ? "bg-brand-yellow w-8 shadow-[0_0_10px_#ff9f00]"
                      : "bg-white/20 hover:bg-white/40 w-4"
                    }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
