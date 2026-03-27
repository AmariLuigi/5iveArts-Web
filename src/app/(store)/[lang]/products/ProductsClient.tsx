"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { Box, Search, ChevronLeft, ChevronRight, Hand, ArrowUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * REUSABLE: Horizontal Scroll Container with Arrow Controls
 * Automatically handles visibility based on overflow and scroll position.
 */
function HorizontalNexus({ children, label }: { children: React.ReactNode, label: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const [showHint, setShowHint] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Safety check for overflow
    const isOverflowing = el.scrollWidth > el.clientWidth;
    
    setShowLeft(isOverflowing && el.scrollLeft > 10);
    setShowRight(isOverflowing && (el.scrollLeft + el.clientWidth < el.scrollWidth - 10));

    // Hide hint once they start scrolling
    if (el.scrollLeft > 5) setShowHint(false);
  };

  useEffect(() => {
    // Initial check for hint (mobile only)
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth && window.innerWidth < 768) {
      setShowHint(true);
      // Auto-hide hint after 6 seconds if no interaction
      const timeout = setTimeout(() => setShowHint(false), 6000);
      return () => clearTimeout(timeout);
    }
  }, [children]);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    setShowHint(false);
  };

  return (
    <div className="flex items-center gap-4 group/nexus relative pb-2 pt-2 border-t border-white/5 first:border-0">
      <span className="text-[9px] uppercase font-black text-white/20 tracking-widest min-w-[80px] shrink-0">{label}</span>
      
      <div className="relative flex-1 min-w-0 overflow-hidden">
        {/* Navigation Arrows (Desktop Only) */}
        {showLeft && (
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/90 text-brand-yellow border-r border-white/10 hover:bg-white/5 transition-all animate-in fade-in duration-300 backdrop-blur-md"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
        
        {showRight && (
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/90 text-brand-yellow border-l border-white/10 hover:bg-white/5 transition-all animate-in fade-in duration-300 backdrop-blur-md"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Mobile Swipe Hint (Fades out on scroll) */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: [20, -20, 20] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                opacity: { duration: 0.5 },
                x: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
              }}
              className="md:hidden absolute right-10 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center gap-2"
            >
              <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-2 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(255,159,0,0.1)]">
                <Hand className="w-4 h-4 text-brand-yellow" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Scrollable Deck */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {children}
          {/* Edge Padding to ensure right-most items aren't cut by arrow/shadow */}
          <div className="min-w-[40px] shrink-0" />
        </div>
      </div>
    </div>
  );
}

function ProductsContent({ 
  initialProducts, 
  dict,
  lang
}: { 
  initialProducts: Product[],
  dict: any,
  lang: string
}) {
  const searchParams = useSearchParams();
  const { track } = useAnalytics();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sync with URL params
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const taxonomy = useMemo(() => {
    const mainCats = new Set<string>();
    const franchises = new Set<string>();
    const subcats = new Set<string>();
    
    initialProducts.forEach(p => {
      if (p.category) mainCats.add(p.category);
      if (p.franchise) franchises.add(p.franchise);
      if (p.subcategory) subcats.add(p.subcategory);
    });
    
    return {
      main: ["all", ...Array.from(mainCats)].sort(),
      franchise: Array.from(franchises).sort(),
      subcategory: Array.from(subcats).sort()
    };
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesCategory = activeCategory === "all" || 
                              p.category === activeCategory || 
                              p.franchise === activeCategory ||
                              p.subcategory === activeCategory ||
                              (p.tags && p.tags.includes(activeCategory));
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (p.franchise && p.franchise.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [initialProducts, activeCategory, searchTerm]);

  // Debounced Search Analytics
  useEffect(() => {
    if (!searchTerm.trim()) return;

    const timer = setTimeout(() => {
      track("search_performed", { 
        term: searchTerm.trim(), 
        results_count: filteredProducts.length,
        has_results: filteredProducts.length > 0,
        active_category: activeCategory
      });
    }, 2000); // 2s debounce to capture full intent without noise

    return () => clearTimeout(timer);
  }, [searchTerm, track]); // Track whenever search term stabilizes

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    track("filter_applied", { value: cat, source: "taxonomy_nexus" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-screen">
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="flex-1">
          <span className="text-[11px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block animate-in fade-in slide-in-from-bottom-2 duration-700">
            {dict.homepage.premiumSeries}
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {dict.products.title}
          </h1>
          <p className="text-neutral-500 mt-6 text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <span className="w-10 h-px bg-white/10" />
            {filteredProducts.length} {dict.products.all}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group min-w-[300px] animate-in fade-in slide-in-from-right-4 duration-1000 delay-500">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={dict.products.filter}
            className="w-full bg-white/[0.02] border border-white/5 py-4 pl-12 pr-6 text-[10px] uppercase font-black tracking-widest text-white placeholder:text-neutral-700 focus:outline-none focus:border-brand-yellow/30 transition-all rounded-sm"
          />
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="mb-16 space-y-2 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
        {/* Row 1: Base Categories */}
        <HorizontalNexus label="Type /">
          {taxonomy.main.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-4 py-2 shrink-0 text-[10px] uppercase font-black tracking-widest rounded-sm transition-all border ${
                activeCategory === cat 
                  ? "bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
                  : "bg-white/[0.02] text-neutral-500 border-white/5 hover:border-white/20 hover:text-white"
              }`}
            >
              {cat === "all" ? dict.products.all : cat}
            </button>
          ))}
        </HorizontalNexus>

        {/* Row 2: Franchises */}
        {taxonomy.franchise.length > 0 && (
          <HorizontalNexus label="Franchise /">
            {taxonomy.franchise.map(fan => (
              <button
                key={fan}
                onClick={() => handleCategorySelect(fan)}
                className={`px-4 py-2 shrink-0 text-[10px] uppercase font-black tracking-widest rounded-sm transition-all border ${
                  activeCategory === fan 
                    ? "bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
                    : "bg-white/[0.02] text-neutral-500 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {fan}
              </button>
            ))}
          </HorizontalNexus>
        )}

        {/* Row 3: Characters */}
        {taxonomy.subcategory.length > 0 && (
          <HorizontalNexus label="Subject /">
            {taxonomy.subcategory.map(sub => (
              <button
                key={sub}
                onClick={() => handleCategorySelect(sub)}
                className={`px-4 py-2 shrink-0 text-[10px] uppercase font-black tracking-widest rounded-sm transition-all border ${
                  activeCategory === sub 
                    ? "bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
                    : "bg-white/[0.02] text-neutral-500 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {sub}
              </button>
            ))}
          </HorizontalNexus>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-40 bg-white/[0.01] border border-dashed border-white/5 rounded-sm animate-in fade-in zoom-in duration-1000">
          <Box className="w-12 h-12 text-neutral-800 mx-auto mb-6 opacity-20" />
          <p className="text-neutral-600 font-black uppercase tracking-[0.3em] text-[10px]">
            No masterpieces match your configuration
          </p>
          <button 
            onClick={() => {handleCategorySelect("all"); setSearchTerm("");}}
            className="mt-6 text-brand-yellow text-[9px] uppercase font-black tracking-widest hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={`${product.id}-${lang}`} 
              product={product} 
              lang={lang} 
              dict={dict}
            />
          ))}
        </div>
      )}

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 bg-brand-yellow text-black border border-white/10 rounded-sm shadow-[0_0_30px_rgba(255,159,0,0.4)] hover:bg-white hover:text-black transition-all group"
            aria-label="Back to top"
          >
             <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsClient(props: { 
  initialProducts: Product[],
  dict: any,
  lang: string
}) {
  return (
    <Suspense fallback={<div className="min-h-screen text-white p-20 flex items-center justify-center font-black uppercase tracking-widest text-[10px]">Filtering Vault...</div>}>
      <ProductsContent {...props} />
    </Suspense>
  );
}
