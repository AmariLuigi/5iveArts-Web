"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";

interface CookieBannerProps {
  dict: any;
  lang: string;
}

export default function CookieBanner({ dict, lang }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem("5ivearts-cookies-accepted");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("5ivearts-cookies-accepted", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-7xl mx-auto relative group">
            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 z-[110] p-2 text-neutral-600 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="bg-[#09090b] border border-white/5 rounded-lg shadow-[0_-20px_40px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:px-10 md:py-8">
              
              {/* SLA Printer Micro-Scene */}
              <div className="printer-container flex-shrink-0 scale-90 md:scale-100 origin-center">
                <div className="z-rail"></div>

                <div className="uv-screen-wrapper">
                  <div className="uv-glow"></div>
                </div>

                <div className="build-arm">
                  <div className="plate-mount"></div>
                  <div className="plate"></div>
                  
                  <div className="cookie-wrapper">
                    <div className="cookie-shape"></div>
                  </div>
                </div>

                <div className="resin-drip drip-1"></div>
                <div className="resin-drip drip-2"></div>
                <div className="resin-drip drip-3"></div>

                <div className="vat">
                  <div className="vat-surface"></div>
                </div>

                <div className="absolute top-1.5 right-2 text-[8px] text-gray-500 font-mono tracking-tight z-20 mix-blend-screen uppercase">
                  SLA_UNIT // ONLINE
                </div>
              </div>

              {/* Text Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center px-2 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded text-[10px] font-black uppercase tracking-widest text-brand-orange mb-3">
                  {dict.cookie_banner.tag}
                </div>
                <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter mb-2">
                  {dict.cookie_banner.title}
                </h2>
                <p className="text-neutral-400 text-xs md:text-sm font-medium leading-relaxed max-w-2xl">
                  {dict.cookie_banner.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={handleAccept}
                  className="w-full md:w-auto px-8 py-3 bg-brand-yellow text-black font-black uppercase tracking-widest text-xs rounded hover:bg-[#ffaa22] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-yellow/10"
                >
                  {dict.cookie_banner.accept}
                </button>
                <Link 
                  href={`/${lang}/privacy`}
                  className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {dict.cookie_banner.preferences}
                </Link>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
