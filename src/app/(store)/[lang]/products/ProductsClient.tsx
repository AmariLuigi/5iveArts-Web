"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { Box, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";

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

  // Sync with URL params
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  const categories = useMemo(() => {
    const catsAndTags = new Set<string>();
    initialProducts.forEach(p => {
      if (p.category) catsAndTags.add(p.category);
      if (p.franchise) catsAndTags.add(p.franchise);
      if (p.subcategory) catsAndTags.add(p.subcategory);
      if (p.tags) p.tags.forEach(t => catsAndTags.add(t));
    });
    return ["all", ...Array.from(catsAndTags)].sort();
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

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    track("category_clicked", { category: cat, source: "filter_bar" });
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
      <div className="mb-16 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[9px] uppercase font-black text-white/20 tracking-widest min-w-[80px]">{dict.products.categories} /</span>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 text-[9px] uppercase font-black tracking-widest rounded-sm transition-all border ${
                  activeCategory === cat 
                    ? "bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
                    : "bg-white/[0.02] text-neutral-500 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat === "all" ? dict.products.all : cat}
              </button>
            ))}
          </div>
        </div>
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
