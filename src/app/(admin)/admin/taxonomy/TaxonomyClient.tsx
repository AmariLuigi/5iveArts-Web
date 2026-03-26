"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
    GitCommit, 
    Trash2, 
    AlertCircle, 
    Loader2, 
    ChevronRight,
    Search,
    RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FranchiseNode {
    name: string;
    types: string[];
    subjects: string[];
    isLegacy?: boolean;
    isCategorical?: boolean;
}

export default function TaxonomyClient() {
    const [taxonomy, setTaxonomy] = useState<FranchiseNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeOperation, setActiveOperation] = useState<string | null>(null);

    useEffect(() => {
        fetchTaxonomy();
    }, []);

    const fetchTaxonomy = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/admin/taxonomy");
            setTaxonomy(res.data);
        } catch (err) {
            console.error("Discovery failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePurge = async (type: 'franchise' | 'subcategory' | 'tags', value: string) => {
        const msg = type === 'tags' 
            ? `CLEANUP PROTOCOL: This will remove the tag '${value}' from ALL products. Proceed?`
            : `GLOBAL PURGE PROTOCOL: This will remove ${type} '${value}' from all products. Proceed?`;
            
        if (!confirm(msg)) return;

        setActiveOperation(`${type}-${value}`);
        try {
            await axios.delete(`/api/admin/taxonomy?type=${type}&value=${encodeURIComponent(value)}`);
            await fetchTaxonomy();
        } catch (err) {
            alert("Purge failed. Database locked.");
        } finally {
            setActiveOperation(null);
        }
    };

    const filteredTaxonomy = taxonomy.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-white/40">Syncing Lore Vault...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-12 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="flex-1">
                    <span className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-4 block">Archive Management</span>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-[0.9]">
                        Lore <span className="text-white/20 italic">Taxonomy</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Find character or universe..."
                            className="bg-white/[0.02] border border-white/5 py-4 pl-12 pr-6 text-[10px] uppercase font-black tracking-widest text-white focus:outline-none focus:border-brand-yellow/30 transition-all rounded-sm min-w-[300px]"
                        />
                    </div>
                    <button 
                        onClick={fetchTaxonomy}
                        className="p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/5 transition-colors group"
                    >
                        <RefreshCw className="w-4 h-4 text-neutral-500 group-hover:text-brand-yellow transition-colors" />
                    </button>
                </div>
            </header>

            {filteredTaxonomy.length === 0 ? (
                <div className="text-center py-40 bg-white/[0.01] border border-dashed border-white/5 rounded-sm">
                    <AlertCircle className="w-10 h-10 text-neutral-800 mx-auto mb-6 opacity-20" />
                    <p className="text-neutral-600 font-black uppercase tracking-[0.3em] text-[10px]">No Lore Records Found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-12">
                    <AnimatePresence mode="popLayout">
                        {filteredTaxonomy.map((franchise) => (
                            <motion.div
                                key={franchise.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group/nexus border rounded-sm overflow-hidden ${franchise.isLegacy ? 'bg-black/80 border-neutral-800' : 'bg-[#050505] border-white/5'}`}
                            >
                                {/* Franchise Row */}
                                <div className={`p-8 border-b flex items-center justify-between ${franchise.isLegacy ? 'border-neutral-800 bg-neutral-900/20' : 'border-white/5 bg-white/[0.01]'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 bg-black border rounded-sm flex items-center justify-center shadow-[0_4px_15px_rgba(255,215,0,0.1)] ${franchise.isLegacy ? 'border-neutral-800 text-neutral-600' : 'border-white/10 text-brand-yellow'}`}>
                                            <GitCommit className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className={`text-2xl font-black uppercase tracking-tighter ${franchise.isLegacy ? 'text-neutral-500' : 'text-white'}`}>{franchise.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                                {franchise.isLegacy ? (
                                                    <span className="text-[8px] uppercase font-black tracking-widest text-[#df9e55] bg-[#df9e55]/10 px-2 py-0.5 rounded-[2px]">Unmapped Discovery</span>
                                                ) : (
                                                    franchise.types.map(t => (
                                                        <span key={t} className="text-[8px] uppercase font-black tracking-widest text-neutral-600 border border-neutral-800 px-2 py-0.5 rounded-[2px]">{t}</span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {!franchise.isLegacy && (
                                        <button 
                                            onClick={() => handlePurge('franchise', franchise.name)}
                                            disabled={activeOperation !== null}
                                            className="p-3 text-neutral-600 hover:text-red-500 hover:bg-red-500/5 transition-all group/trash"
                                        >
                                            {activeOperation === `franchise-${franchise.name}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 group-hover/trash:scale-110 transition-transform" /> }
                                        </button>
                                    )}
                                </div>

                                {/* Subjects Row */}
                                <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-black/40 relative">
                                    <div className={`absolute left-8 top-0 w-px h-full bg-gradient-to-b from-transparent ${franchise.isLegacy ? 'from-neutral-800' : 'from-brand-yellow/20'}`} />
                                    
                                    {franchise.subjects.map((sub) => (
                                        <div key={sub} className="group/sub flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-sm hover:border-white/10 transition-all">
                                            <span className="text-[9px] uppercase font-black tracking-widest text-neutral-400 group-hover/sub:text-white transition-colors">{sub}</span>
                                            <button 
                                                onClick={() => {
                                                    if (franchise.isLegacy) {
                                                        handlePurge('tags', sub);
                                                    } else if (franchise.isCategorical) {
                                                        // This is a 'Category:Value' tag in the DB
                                                        handlePurge('tags', `${franchise.name}:${sub}`);
                                                    } else {
                                                        // This is a specialized database column
                                                        handlePurge('subcategory', sub);
                                                    }
                                                }}
                                                disabled={activeOperation !== null}
                                                className="opacity-0 group-hover/sub:opacity-100 p-2 text-neutral-600 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {franchise.subjects.length === 0 && (
                                        <span className="text-[9px] uppercase font-black text-neutral-600 tracking-widest col-span-full">Subject Identification Pending...</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
