"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, BarChart, Loader2 } from "lucide-react";

interface CategoryStat {
    name: string;
    clicks: number;
}

export default function CategoryInsights() {
    const [stats, setStats] = useState<CategoryStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get("/api/admin/analytics/categories");
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch category insights:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
            <p className="text-[10px] uppercase font-black tracking-widest text-neutral-600 italic">Decrypting Interest Profiles...</p>
        </div>
    );

    const maxClicks = Math.max(...stats.map(s => s.clicks), 0);

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                <BarChart className="w-3.5 h-3.5" />
                Category Interest Ranking
            </h3>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-sm p-8 space-y-6 border-l-brand-yellow/20 border-l-4">
                {stats.length === 0 ? (
                    <p className="text-[10px] font-black uppercase text-neutral-600 text-center py-10">No engagement data recorded</p>
                ) : (
                    <div className="space-y-8">
                        {stats.map((cat, i) => (
                            <div key={cat.name} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-white/20">#{i + 1}</span>
                                        <span className="text-xs font-black uppercase text-white tracking-widest">{cat.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-brand-yellow flex items-center gap-1.5">
                                        {cat.clicks} CLICK {cat.clicks > 1 ? 'S' : ''}
                                        <TrendingUp className="w-3 h-3 text-brand-yellow/40" />
                                    </span>
                                </div>
                                <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-brand-yellow rounded-full transition-all duration-1000 origin-left"
                                        style={{ width: `${(cat.clicks / maxClicks) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[8px] font-bold uppercase text-neutral-600 tracking-widest">REAL-TIME VAULT METRICS</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
            </div>
        </div>
    );
}
