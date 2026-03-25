"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

export interface HeroSectionProps {
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  heroVideos?: string[];
  heroPosters?: string[]; // Optional: Add support for poster images for LCP/Performance
  translatedSlides?: any[];
  trustLabels?: {
    quality: string;
    handFinished: string;
    logistics: string;
  };
}

export default function HeroSection({
  primaryCta,
  secondaryCta,
  heroVideos = [],
  heroPosters = [],
  translatedSlides,
  trustLabels
}: HeroSectionProps) {
  // Use DB videos and dictionary text exclusively. 
  // If no DB content is available, this will render a clean, high-performance fallback layout.
  const activeSlides = heroVideos.length > 0
    ? heroVideos.map((url, i) => ({
      ...(translatedSlides?.[i] || translatedSlides?.[0] || {}),
      video: url,
      poster: heroPosters?.[i] || ""
    }))
    : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const heroRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Disable parallax on touch devices or fine pointer is not available
      if (typeof window !== 'undefined' && !window.matchMedia("(pointer: fine)").matches) return;
      
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      setMousePosition({
        x: (e.clientX - centerX) / (typeof window !== 'undefined' ? window.innerWidth / 2 : 1),
        y: (e.clientY - centerY) / (typeof window !== 'undefined' ? window.innerHeight / 2 : 1),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const goToNext = useCallback(() => {
    if (transitioning) return;

    setTransitioning(true);
    const next = (activeIndex + 1) % activeSlides.length;

    const nextVideo = videoRefs.current[next];
    if (nextVideo) {
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => { });
    }

    setTimeout(() => {
      setActiveIndex(next);
      setTransitioning(false);

      const prevVideo = videoRefs.current[activeIndex];
      if (prevVideo && activeIndex !== next) {
        prevVideo.pause();
      }
    }, 800);
  }, [activeIndex, transitioning, activeSlides.length]);

  useEffect(() => {
    const activeListeners: (() => void)[] = [];

    videoRefs.current.forEach((v, i) => {
      if (v) {
        v.playbackRate = 1.2;
        v.muted = true;

        const handleEnded = () => {
          if (i === activeIndex) {
            goToNext();
          }
        };

        v.addEventListener("ended", handleEnded);
        activeListeners.push(() => v.removeEventListener("ended", handleEnded));
      }
    });

    return () => {
      activeListeners.forEach(cleanup => cleanup());
    };
  }, [goToNext, activeIndex]);

  useEffect(() => {
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo && !transitioning) {
      currentVideo.play().catch(() => { });
    }
  }, [activeIndex, transitioning]);

  // Use first translated slide or first default as fallback for text content
  const slide = activeSlides[activeIndex] || translatedSlides?.[0] || {};

  const taglineX = mousePosition.x * -10;
  const taglineY = mousePosition.y * -5;
  const headlineX = mousePosition.x * -15;
  const headlineY = mousePosition.y * -8;
  const subtextX = mousePosition.x * -8;
  const subtextY = mousePosition.y * -4;
  const ctaX = mousePosition.x * -5;
  const ctaY = mousePosition.y * -3;
  const trustX = mousePosition.x * -3;
  const trustY = mousePosition.y * -2;

  const textContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden bg-black text-white px-4 border-b border-white/5">
      <AnimatePresence mode="popLayout">
        {activeSlides.map((s, i) => (
          <motion.div
            key={s.video}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{
              opacity: activeIndex === i && !transitioning ? 1 : 0,
              scale: activeIndex === i ? 1 : 1.02,
            }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                x: activeIndex === i ? mousePosition.x * -5 : 0,
                y: activeIndex === i ? mousePosition.y * -5 : 0,
              }}
              transition={{ type: "tween", duration: 0.5 }}
            >
              {i === 0 && s.poster && (
                <div className="absolute inset-0 z-[-1]">
                  <Image
                    src={s.poster}
                    alt=""
                    fill
                    priority
                    fetchPriority="high"
                    className="object-cover opacity-90 contrast-110 brightness-110 saturate-[1.1]"
                  />
                </div>
              )}
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={activeIndex === i ? s.video : ""}
                poster={s.poster}
                muted
                playsInline
                loop={false}
                preload={i === 0 ? "auto" : "none"}
                aria-hidden="true"
                className="w-full h-full object-cover opacity-90 contrast-110 brightness-110 saturate-[1.1]"
              >
                <track kind="captions" />
              </video>
            </motion.div>
            <div className={`absolute inset-0 ${i === 1 ? "bg-black/40" : ""}`} />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10" />
      <div className="absolute inset-0 bg-black/20 z-10" />

      <motion.div
        className={`relative z-20 max-w-7xl mx-auto text-center py-20 w-full transition-all duration-700 ease-in-out ${transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
      >
        <motion.span
          className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-6 block"
          initial={false}
          animate="visible"
          variants={textContainerVariants}
        >
          <motion.span
            variants={wordVariants}
            style={{ display: "inline-block" }}
            animate={{ x: taglineX, y: taglineY }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {slide.tagline}
          </motion.span>
        </motion.span>

        <motion.h1
          className="text-4xl sm:text-6xl md:text-[10rem] font-black leading-[0.85] mb-10 uppercase tracking-tighter flex flex-col items-center justify-center"
          initial={false}
          animate="visible"
          variants={textContainerVariants}
        >
          <motion.span
            className="inline-block"
            variants={wordVariants}
            style={{ x: headlineX, y: headlineY }}
          >
            {slide.headline}
          </motion.span>
          <motion.span
            className="text-brand-yellow inline-block drop-shadow-[0_10px_40px_rgba(255,159,0,0.4)]"
            variants={wordVariants}
            style={{ x: headlineX, y: headlineY }}
          >
            {slide.headlineHighlight}
          </motion.span>
        </motion.h1>

        <motion.p
          className="max-w-3xl mx-auto text-lg md:text-2xl text-white mb-14 leading-relaxed font-bold uppercase tracking-[0.3em] text-[13px] opacity-80"
          initial={false}
          animate="visible"
          variants={fadeUpVariants}
          style={{ x: subtextX, y: subtextY }}
        >
          {slide.subtext}
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-8"
          initial={false}
          animate="visible"
          variants={fadeUpVariants}
          style={{ x: ctaX, y: ctaY }}
        >
          <Link
            href={primaryCta.href}
            className="hasbro-btn-primary text-sm px-16 py-6 shadow-[0_25px_50px_rgba(255,159,0,0.2)] hover:scale-105 transition-transform"
          >
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="border-2 border-white/20 text-white font-black uppercase tracking-[0.2em] text-[10px] px-16 py-6 rounded hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-md"
            >
              {secondaryCta.label}
            </Link>
          )}
        </motion.div>

        <motion.div
          className="flex justify-center gap-4 mt-16"
          initial={false}
          animate="visible"
          variants={fadeUpVariants}
        >
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== activeIndex) {
                  setTransitioning(true);
                  setTimeout(() => {
                    const nextVideo = videoRefs.current[i];
                    if (nextVideo) {
                      nextVideo.currentTime = 0;
                      nextVideo.play();
                    }
                    const currentVideo = videoRefs.current[activeIndex];
                    if (currentVideo) currentVideo.pause();
                    setActiveIndex(i);
                    setTransitioning(false);
                  }, 800);
                }
              }}
              className={`w-10 h-1.5 rounded-full transition-all duration-500 ${activeIndex === i
                ? "bg-brand-yellow w-20 shadow-[0_0_15px_#ff9f00]"
                : "bg-white/20 hover:bg-white/40"
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </motion.div>

        <motion.div
          className="mt-28 pt-10 border-t border-white/10 flex flex-wrap justify-center gap-x-20 gap-y-6 text-white/50 text-[11px] uppercase font-black tracking-[0.4em]"
          initial={false}
          animate="visible"
          variants={textContainerVariants}
          style={{ x: trustX, y: trustY }}
        >
          <motion.span className="flex items-center gap-4" variants={fadeUpVariants}>
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_10px_#ff9f00]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />{" "}
            {trustLabels?.quality || "Certified Quality"}
          </motion.span>
          <motion.span className="flex items-center gap-4" variants={fadeUpVariants}>
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_10px_#ff9f00]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />{" "}
            {trustLabels?.handFinished || "Hand-Finished"}
          </motion.span>
          <motion.span className="flex items-center gap-4" variants={fadeUpVariants}>
            <motion.span
              className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_10px_#ff9f00]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />{" "}
            {trustLabels?.logistics || "Global Logistics"}
          </motion.span>
        </motion.div>
      </motion.div>
    </section>
  );
}
