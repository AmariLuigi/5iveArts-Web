"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";

interface Slide {
  video: string;
  tagline: string;
  headline: string;
  headlineHighlight: string;
  subtext: string;
}

const SLIDES: Slide[] = [
  {
    video: "/video/Yellow_resin_3d_printer_model_delpmaspu_ (3).mp4",
    tagline: "Precision Resin Technology",
    headline: "3D",
    headlineHighlight: "Printed",
    subtext:
      "High-resolution resin prints at 0.025 mm layer height — every detail captured with industrial-grade precision.",
  },
  {
    video: "/video/Painter_adding_detail_to_model_delpmaspu_.mp4",
    tagline: "Artisan Hand-Finishing",
    headline: "Hand",
    headlineHighlight: "Painted",
    subtext:
      "Professional airbrush techniques bring each figure to life — hand-finished by skilled artists, one stroke at a time.",
  },
];

export interface HeroSectionProps {
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

/**
 * Full-width hero banner with dual-video crossfade carousel.
 * Video 1: 3D printing process → Video 2: Hand-painting process → loops.
 */
export default function HeroSection({
  primaryCta,
  secondaryCta,
}: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);

  const goToNext = useCallback(() => {
    if (transitioning) return;

    setTransitioning(true);
    const next = (activeIndex + 1) % SLIDES.length;

    // Start playing the NEXT video in the background so it's ready
    const nextVideo = videoRefs.current[next];
    if (nextVideo) {
      nextVideo.currentTime = 0;
      const playPromise = nextVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { /* Handle auto-play block if any */ });
      }
    }

    // After the CSS fade-out finishes, swap the active index
    setTimeout(() => {
      setActiveIndex(next);
      setTransitioning(false);

      // Pause the old video to save resources
      const prevVideo = videoRefs.current[activeIndex];
      if (prevVideo && activeIndex !== next) {
        prevVideo.pause();
      }
    }, 800); // match the CSS transition duration
  }, [activeIndex, transitioning]);

  useEffect(() => {
    const activeListeners: (() => void)[] = [];

    // Initial setup for all videos
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

  // Ensure first video is playing if it's the active one and not yet playing
  useEffect(() => {
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo && !transitioning) {
      currentVideo.play().catch(() => { });
    }
  }, [activeIndex, transitioning]);

  const slide = SLIDES[activeIndex];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-black text-white px-4 border-b border-white/5">
      {/* Dual Video Backgrounds */}
      {SLIDES.map((s, i) => (
        <div
          key={s.video}
          className="absolute inset-0 z-0 transition-opacity duration-[800ms] ease-in-out"
          style={{ opacity: activeIndex === i && !transitioning ? 1 : 0 }}
        >
          <video
            ref={(el) => { videoRefs.current[i] = el; }}
            src={s.video}
            muted
            playsInline
            loop={false}
            preload="auto"
            className="w-full h-full object-cover opacity-90 contrast-110 brightness-110 saturate-[1.1]"
          />
          {/* Per-video overlay — stronger on the painter video */}
          <div className={`absolute inset-0 ${i === 1 ? "bg-black/40" : ""}`} />
        </div>
      ))}

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10" />
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Text Content — crossfades with the video */}
      <div
        className={`relative z-20 max-w-7xl mx-auto text-center py-20 w-full transition-all duration-700 ease-in-out ${transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
      >
        <span className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-6 block">
          {slide.tagline}
        </span>
        <h1 className="text-7xl md:text-[10rem] font-black leading-[0.85] mb-10 uppercase tracking-tighter">
          {slide.headline}{" "}
          <span className="text-brand-yellow inline-block drop-shadow-[0_10px_40px_rgba(255,159,0,0.4)]">
            {slide.headlineHighlight}
          </span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-2xl text-white mb-14 leading-relaxed font-bold uppercase tracking-[0.3em] text-[13px] opacity-80">
          {slide.subtext}
        </p>
        <div className="flex flex-wrap justify-center gap-8">
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
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex justify-center gap-4 mt-16">
          {SLIDES.map((_, i) => (
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
                    // Pause the current one
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
        </div>

        {/* Dynamic Trust Indicators */}
        <div className="mt-28 pt-10 border-t border-white/10 flex flex-wrap justify-center gap-x-20 gap-y-6 text-white/50 text-[11px] uppercase font-black tracking-[0.4em]">
          <span className="flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_10px_#ff9f00]" />{" "}
            Certified Quality
          </span>
          <span className="flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_10px_#ff9f00]" />{" "}
            Hand-Finished
          </span>
          <span className="flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_10px_#ff9f00]" />{" "}
            Global Logistics
          </span>
        </div>
      </div>
    </section>
  );
}
