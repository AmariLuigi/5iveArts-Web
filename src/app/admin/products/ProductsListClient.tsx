"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/products";
import { DbProduct } from "@/types/supabase";
import { Search, Filter, Edit3, Trash2, Box, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ProductsListClientProps {
    initialProducts: DbProduct[];
}

export default function ProductsListClient({ initialProducts }: ProductsListClientProps) {
    const [products, setProducts] = useState<DbProduct[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(id);
        setError(null);

        try {
            await axios.delete(`/api/admin/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
            router.refresh();
        } catch (err: any) {
            console.error("[handleDelete] Error:", err);
            setError(`Failed to delete product: ${err.response?.data?.error || err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const stats = {
        total: products.length,
        lowStock: products.filter(p => p.stock <= 3 && p.stock > 0).length,
        outOfStock: products.filter(p => p.stock === 0).length
    };

    return (
        <div className="space-y-12">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Total Pieces</p>
                    <p className="text-2xl font-black text-white">{stats.total}</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Low Stock Alerts</p>
                    <p className="text-2xl font-black text-orange-500">{stats.lowStock}</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-neutral-600 mb-1">Out of Stock</p>
                    <p className="text-2xl font-black text-red-500">{stats.outOfStock}</p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">{error}</p>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex gap-4">
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter by name, ID or category..."
                        className="bg-white/5 border border-white/5 py-3 pl-12 pr-6 text-[10px] uppercase font-black tracking-widest text-white placeholder:text-neutral-700 focus:outline-none focus:border-brand-yellow/50 transition-all rounded-sm w-full"
                    />
                </div>
                <button className="p-3 bg-white/5 border border-white/5 text-neutral-500 hover:text-brand-yellow transition-colors rounded-sm">
                    <Filter className="w-4 h-4" />
                </button>
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
                                    <span className={`px-2 py-1 rounded-[2px] border text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${product.status === "draft" ? "text-neutral-400 bg-black/50 border-white/10" : "text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20"}`}>
                                        {product.status === "draft" ? (
                                            <span className="flex items-center gap-1.5"><EyeOff className="w-3 h-3" /> Draft</span>
                                        ) : (
                                            <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> Published</span>
                                        )}
                                    </span>
                                    <span className={`px-2 py-1 rounded-[2px] border text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${product.stock === 0 ? "text-red-400 bg-red-500/20 border-red-500/30" :
                                        product.stock <= 3 ? "text-orange-400 bg-orange-500/20 border-orange-500/30" :
                                            "text-green-400 bg-green-500/20 border-green-500/30"
                                        }`}>
                                        Stock: {product.stock}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <span className="text-[9px] uppercase font-black tracking-widest text-brand-yellow mb-1 block">{product.category}</span>
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
