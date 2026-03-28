"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/products";
import { DbProduct } from "@/types/supabase";
import { Search, Filter, Edit3, Trash2, Box, Eye, EyeOff, Loader2, AlertCircle, Copy, ChevronDown, Tag, Archive } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/ui/CustomSelect";

interface ProductsListClientProps {
    initialProducts: DbProduct[];
}

export default function ProductsListClient({ initialProducts }: ProductsListClientProps) {
    const [products, setProducts] = useState<DbProduct[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Derive unique categories and tags for the filter
    const categories = Array.from(new Set(initialProducts.map(p => p.category))).sort();
    const allTags = Array.from(new Set(initialProducts.flatMap(p => p.tags || []))).sort();

    const filteredProducts = products.filter(p => {
        const matchesSearch = 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
        const matchesTag = tagFilter === "all" || (p.tags || []).includes(tagFilter);

        return matchesSearch && matchesStatus && matchesCategory && matchesTag;
    });

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action is permanent and will delete all associated media.`)) return;
        
        setDeletingId(id);
        setError(null);
        
        try {
            const { data } = await axios.delete(`/api/admin/products/${id}`);
            
            // Remove from local state
            setProducts(prev => prev.filter(p => p.id !== id));
            
            if (data.archived) {
                alert(`"${name}" was archived because it is linked to existing orders. It is now hidden from the store and admin list.`);
            }

            // Ensure server components refresh too
            router.refresh();
        } catch (err: any) {
            const errMsg = err.response?.data?.error || "Failed to delete product";
            const details = err.response?.data?.details;
            const fullMsg = details ? `${errMsg}: ${details}` : errMsg;
            
            setError(fullMsg);
            alert(fullMsg);
        } finally {
            setDeletingId(null);
        }
    };

    const stats = {
        total: products.length,
        published: products.filter(p => p.status === 'published').length,
        draft: products.filter(p => p.status === 'draft').length,
        archived: products.filter(p => p.status === 'archived').length
    };

    return (
        <div className="space-y-12">
            {/* Stats Summary - Remains unchanged */}
            
            {/* ... */}

            {/* Search & Filter Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 overflow-x-auto pb-4 md:pb-0">
                <div className="relative group min-w-[300px] flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search collection by name or ID..."
                        className="bg-white/5 border border-white/5 py-3 pl-12 pr-6 text-[10px] uppercase font-black tracking-widest text-white placeholder:text-neutral-700 focus:outline-none focus:border-brand-yellow/50 transition-all rounded-sm w-full"
                    />
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    {/* Status Filter */}
                    <div className="relative group min-w-[140px] flex-1 md:flex-none">
                        <CustomSelect
                            value={statusFilter}
                            onChange={(val: string) => setStatusFilter(val)}
                            options={[
                                { code: "all", name: "All Visibility" },
                                { code: "published", name: "Published" },
                                { code: "draft", name: "Drafts" },
                                { code: "archived", name: "Archived" }
                            ]}
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative group min-w-[140px] flex-1 md:flex-none">
                        <CustomSelect
                            value={categoryFilter}
                            onChange={(val: string) => setCategoryFilter(val)}
                            options={[
                                { code: "all", name: "All Chapters" },
                                ...categories.map(cat => ({ code: cat, name: cat }))
                            ]}
                        />
                    </div>

                    {/* Origin/Tag Filter */}
                    <div className="relative group min-w-[140px] flex-1 md:flex-none">
                        <CustomSelect
                            value={tagFilter}
                            onChange={(val: string) => setTagFilter(val)}
                            options={[
                                { code: "all", name: "All Origins" },
                                ...allTags.map(tag => ({ code: tag, name: tag }))
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <div key={product.id} className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden group hover:border-white/10 transition-all flex flex-col">
                            <div className="relative aspect-square bg-[#050505] overflow-hidden">
                                {product.images?.[0] ? (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Box className="w-12 h-12 text-neutral-900" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                                    <span className={`px-2 py-1 rounded-[2px] border text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${
                                        product.status === "draft" ? "text-neutral-400 bg-black/50 border-white/10" : 
                                        product.status === "archived" ? "text-red-400 bg-red-900/20 border-red-500/30" :
                                        "text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20"
                                    }`}>
                                        {product.status === "draft" ? (
                                            <span className="flex items-center gap-1.5"><EyeOff className="w-3 h-3" /> Draft</span>
                                        ) : product.status === "archived" ? (
                                            <span className="flex items-center gap-1.5"><Archive className="w-3 h-3" /> Archived</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> Published</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className="text-[9px] uppercase font-black tracking-widest text-brand-yellow">{product.category}</span>
                                        {/* Lore Tags Rendering */}
                                        {product.tags?.map(tag => {
                                            const hasHierarchy = tag.includes(':');
                                            const [node, value] = hasHierarchy ? tag.split(':') : [null, tag];
                                            
                                            // Highlight Artists in Cyan
                                            if (node?.toLowerCase() === 'artist') {
                                                return (
                                                    <span key={tag} className="text-[8px] uppercase font-bold tracking-widest text-cyan-500 bg-cyan-500/5 px-2 py-0.5 rounded-sm border border-cyan-500/10">
                                                        {value}
                                                    </span>
                                                );
                                            }

                                            return (
                                                <span key={tag} className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm border ${hasHierarchy ? "text-white/40 bg-white/5 border-white/5" : "text-neutral-600 bg-white/5 border-white/[0.02]"}`}>
                                                    {hasHierarchy ? <><span className="opacity-30">{node}:</span>{value}</> : tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-white leading-tight group-hover:text-brand-yellow transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-neutral-600 mt-1 uppercase tracking-widest">Base: {formatPrice(product.price)}</p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-neutral-700 uppercase">ID: {product.id.slice(0, 12)}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(product.id, product.name)}
                                            disabled={deletingId === product.id}
                                            className="p-2 text-neutral-600 hover:text-red-500 transition-colors disabled:opacity-50"
                                            title="Delete permanently"
                                        >
                                            {deletingId === product.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                        <Link
                                            href={`/admin/products/new?duplicate=${product.id}`}
                                            className="p-2 bg-white/5 border border-white/10 text-neutral-400 hover:text-brand-yellow hover:border-brand-yellow/30 transition-all rounded-sm flex items-center gap-2"
                                            title="Duplicate this product"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/products/${product.id}/edit`}
                                            className="p-2 bg-white/5 border border-white/10 text-neutral-400 hover:text-brand-yellow hover:border-brand-yellow/30 transition-all rounded-sm flex items-center gap-2"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            <span className="text-[9px] uppercase font-black tracking-widest">Edit</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center bg-[#0a0a0a] border border-white/5 border-dashed">
                        <Box className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-600">
                            {searchTerm ? "No matches in the vault" : "The Vault is Empty"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
