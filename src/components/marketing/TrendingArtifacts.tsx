"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import MinimalProductCard from "@/components/product/MinimalProductCard";
import { motion } from "framer-motion";

interface TrendingArtifactsProps {
  lang: string;
  dict: any;
}

export default function TrendingArtifacts({ lang, dict }: TrendingArtifactsProps) {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get("/api/public/wishlist/stats");
        setTrending(res.data);
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading || trending.length === 0) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-brand-yellow">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">Most Desired Protocol</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
              Artifacts Under <span className="text-brand-yellow">Observation</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 py-2 px-4 bg-white/5 border border-white/10 rounded-full">
            <Sparkles className="w-4 h-4 text-brand-yellow animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Real-time Interest Sync</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {trending.map((item, idx) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
                <div className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-brand-yellow text-black flex items-center justify-center font-black text-xs shadow-xl border-4 border-black">
                    #{idx + 1}
                </div>
                <MinimalProductCard product={item.product} lang={lang} />
                <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-yellow animate-ping" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-500">
                        {item.count} Active Citations
                    </span>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
