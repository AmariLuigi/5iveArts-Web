"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { Tag, Box, Search } from "lucide-react";

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = useMemo(() => ["all", ...Array.from(new Set(initialProducts.map(p => p.category)))].sort(), [initialProducts]);
  const tags = useMemo(() => ["all", ...Array.from(new Set(initialProducts.flatMap(p => p.tags || [])))].sort(), [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      const matchesTag = activeTag === "all" || (p.tags || []).includes(activeTag);
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [initialProducts, activeCategory, activeTag, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-screen">
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="flex-1">
          <span className="text-[11px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block animate-in fade-in slide-in-from-bottom-2 duration-700">Premium series</span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            The Collection
          </h1>
          <p className="text-neutral-500 mt-6 text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <span className="w-10 h-px bg-white/10" />
            {filteredProducts.length} Prototype{filteredProducts.length !== 1 ? "s" : ""} deployed
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group min-w-[300px] animate-in fade-in slide-in-from-right-4 duration-1000 delay-500">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search the arsenal..."
            className="w-full bg-white/[0.02] border border-white/5 py-4 pl-12 pr-6 text-[10px] uppercase font-black tracking-widest text-white placeholder:text-neutral-700 focus:outline-none focus:border-brand-yellow/30 transition-all rounded-sm"
          />
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="mb-16 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[9px] uppercase font-black text-white/20 tracking-widest min-w-[80px]">Category /</span>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-[9px] uppercase font-black tracking-widest rounded-sm transition-all border ${
                  activeCategory === cat 
                    ? "bg-brand-yellow text-black border-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
                    : "bg-white/[0.02] text-neutral-500 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tags / Origin */}
        <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-8">
          <span className="text-[9px] uppercase font-black text-white/20 tracking-widest min-w-[80px]">Series /</span>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-sm transition-all border ${
                  activeTag === tag 
                    ? "bg-white/10 text-white border-white/20" 
                    : "bg-transparent text-neutral-600 border-transparent hover:text-white"
                }`}
              >
                {tag}
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
            onClick={() => {setActiveCategory("all"); setActiveTag("all"); setSearchTerm("");}}
            className="mt-6 text-brand-yellow text-[9px] uppercase font-black tracking-widest hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
