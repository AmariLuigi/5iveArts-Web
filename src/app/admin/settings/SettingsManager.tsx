"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Truck, 
    Scale, 
    ShieldCheck, 
    Database, 
    Save, 
    Loader2, 
    AlertCircle, 
    CheckCircle,
    Star,
    Search,
    X,
    Plus,
    Video,
    MonitorPlay,
    Upload,
    Film
} from "lucide-react";
import { SiteSettings } from "@/lib/settings";
import { Product } from "@/types";
import { createClient } from "@/lib/supabase-browser";

interface Props {
    initialSettings: SiteSettings;
}

export default function SettingsManager({ initialSettings }: Props) {
    const [settings, setSettings] = useState<SiteSettings>(initialSettings);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [videoInput, setVideoInput] = useState("");

    const supabase = createClient();

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const { data } = await axios.get("/api/admin/products");
                setAllProducts(data);
            } catch (err) {
                console.error("Failed to fetch products for curation:", err);
            }
        };
        fetchAll();
    }, []);

    const handleSave = async (key: keyof SiteSettings, value: any) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await axios.patch("/api/admin/settings", { [key]: value });
            setSettings(prev => ({ ...prev, [key]: value }));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("[SettingsManager] Save Error:", err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateLogistics = (field: string, value: number) => {
        const newLogistics = {
            ...(settings.logistics || { preparation_days_buffer: 2, free_shipping_threshold_cents: 15000 }),
            [field]: value
        };
        handleSave("logistics", newLogistics);
    };

    const updatePricingMultiplier = (type: 'scales' | 'finishes', key: string, multiplier: number) => {
        const currentRef = (settings.pricing?.[type] || {}) as any;
        const newPricing = {
            ...(settings.pricing || { 
                scales: { "1/9": { multiplier: 1.5, size: "20cm" }, "1/6": { multiplier: 2.5, size: "30cm" }, "1/4": { multiplier: 5.0, size: "45cm" } },
                finishes: { painted: { multiplier: 1.0 }, raw: { multiplier: 0.6 } }
            }),
            [type]: {
                ...currentRef,
                [key]: {
                    ...currentRef[key],
                    multiplier
                }
            }
        };
        handleSave("pricing", newPricing);
    };

    const updateHomepageFeatured = (productIds: string[]) => {
        const newHomepage = {
            ...(settings.homepage || { hero_videos: [] }),
            featured_product_ids: productIds
        };
        handleSave("homepage", newHomepage);
    };

    const updateHeroVideos = (videoUrls: string[]) => {
        const newHomepage = {
            ...(settings.homepage || { featured_product_ids: [] }),
            hero_videos: videoUrls
        };
        handleSave("homepage", newHomepage);
    };

    const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `hero_${Date.now()}.${fileExt}`;
            const filePath = `hero/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-media')
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: true,
                    onUploadProgress: (progress: any) => {
                        const percent = (progress.loaded / progress.total) * 100;
                        setUploadProgress(Math.round(percent));
                    }
                } as any);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-media')
                .getPublicUrl(filePath);

            updateHeroVideos([...heroVideos, publicUrl]);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("[HeroUpload] Error:", err);
            setError(`Upload Failed: ${err.message}`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const selectedFeaturedIds = settings.homepage?.featured_product_ids || [];
    const selectedProducts = allProducts.filter(p => selectedFeaturedIds.includes(p.id));
    const suggestedProducts = productSearch.length > 0 
        ? allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && !selectedFeaturedIds.includes(p.id)).slice(0, 5)
        : [];
    
    const heroVideos = settings.homepage?.hero_videos || [];

    return (
        <div className="space-y-12 pb-20">
            {/* Notifications */}
            {success && (
                <div className="fixed bottom-10 right-10 bg-brand-yellow px-6 py-4 rounded-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-500 z-[100]">
                    <CheckCircle className="w-5 h-5 text-black" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">Uplink Successful — System Updated</span>
                </div>
            )}
            
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-sm flex items-start gap-4 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <p className="text-xs font-black uppercase tracking-widest text-red-400">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Home Gallery Curation Card */}
                <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden md:col-span-2">
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center">
                            <Star className="w-5 h-5 text-brand-yellow" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-[2px] border ${settings.homepage?.featured_product_ids?.length ? "text-brand-yellow border-brand-yellow/20 bg-brand-yellow/5" : "text-neutral-700 border-neutral-800 bg-black"}`}>
                            {settings.homepage?.featured_product_ids?.length ? `${settings.homepage.featured_product_ids.length}/3 Featured` : "Default (Auto)"}
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-xl">
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Home Gallery Curation</h3>
                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">Select exactly three masterpieces to be showcased in the primary homepage gallery. These define the visual entrance to the 5iveArts vault.</p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                            <input 
                                type="text"
                                placeholder="SEARCH VAULT FOR FEATURED..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-[10px] font-black text-white focus:border-brand-yellow/20 outline-none placeholder:text-neutral-800"
                            />
                            {suggestedProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 z-50 shadow-2xl rounded-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {suggestedProducts.map(product => (
                                        <button 
                                            key={product.id}
                                            onClick={() => {
                                                if (selectedFeaturedIds.length >= 3) {
                                                    setError("Maximum 3 featured products allowed.");
                                                    return;
                                                }
                                                updateHomepageFeatured([...selectedFeaturedIds, product.id]);
                                                setProductSearch("");
                                            }}
                                            className="w-full text-left p-4 hover:bg-white/5 flex items-center gap-4 transition-colors group border-b border-white/5 last:border-0"
                                        >
                                            <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden">
                                                {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-tight">{product.name}</p>
                                                <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">{product.category}</p>
                                            </div>
                                            <Plus className="ml-auto w-4 h-4 text-neutral-800 group-hover:text-brand-yellow" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
                        {[0, 1, 2].map((i) => {
                            const product = selectedProducts[i];
                            return (
                                <div key={i} className="group relative aspect-[3/4] bg-white/[0.02] border border-white/5 rounded-sm overflow-hidden flex flex-col items-center justify-center text-center p-8 transition-all hover:border-white/10">
                                    {product ? (
                                        <>
                                            <div className="absolute inset-0">
                                                {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                            </div>
                                            <div className="relative z-10">
                                                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-brand-yellow mb-2 block">Slot 0{i+1}</span>
                                                <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1">{product.name}</h4>
                                                <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">{product.category}</p>
                                            </div>
                                            <button 
                                                onClick={() => updateHomepageFeatured(selectedFeaturedIds.filter(id => id !== product.id))}
                                                className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/80 backdrop-blur-md flex items-center justify-center text-white hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5 group-hover:bg-brand-yellow/10 group-hover:border-brand-yellow/20 transition-all">
                                                <Plus className="w-5 h-5 text-neutral-800 group-hover:text-brand-yellow" />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-800 group-hover:text-neutral-600">Pending Assignment</p>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Hero Media Card */}
                <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden md:col-span-2">
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center">
                            <MonitorPlay className="w-5 h-5 text-brand-yellow" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-[2px] border ${heroVideos.length ? "text-brand-yellow border-brand-yellow/20 bg-brand-yellow/5" : "text-neutral-700 border-neutral-800 bg-black"}`}>
                            {heroVideos.length ? `${heroVideos.length} Cinematic Assets` : "Default (Static)"}
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-xl">
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Hero Media Configuration</h3>
                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">Manage the 4K cinematic background sequences that define the first impression of the shop. Provide absolute or relative URLs to your high-impact marketing videos.</p>
                        </div>

                        <div className="flex w-full md:w-auto gap-4">
                            <label className={`flex items-center gap-3 px-6 py-4 bg-white/[0.03] border border-white/5 rounded-sm cursor-pointer hover:bg-white/[0.05] hover:border-brand-yellow/30 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-4 h-4 text-brand-yellow" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Transmit Cinema Asset</span>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={handleHeroVideoUpload} 
                                    disabled={uploading} 
                                />
                            </label>

                            <div className="flex bg-black/40 border border-white/5 rounded-sm p-1">
                                <input 
                                    type="text"
                                    placeholder="OR PASTE URL..."
                                    value={videoInput}
                                    onChange={(e) => setVideoInput(e.target.value)}
                                    className="bg-transparent px-4 py-2 text-[10px] font-black text-white focus:outline-none w-40 placeholder:text-neutral-700"
                                />
                                <button 
                                    onClick={() => {
                                        if (!videoInput) return;
                                        updateHeroVideos([...heroVideos, videoInput]);
                                        setVideoInput("");
                                    }}
                                    className="px-4 bg-brand-yellow text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:brightness-110 transition-all"
                                >
                                    ADD
                                </button>
                            </div>
                        </div>
                    </div>

                    {uploading && (
                        <div className="pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 text-brand-yellow animate-spin" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Transmitting Asset Sequence — {uploadProgress}%</span>
                                </div>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-brand-yellow shadow-[0_0_10px_#ff9f00]" 
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-white/5">
                        {heroVideos.map((url, i) => (
                            <div key={i} className="group relative aspect-video bg-black rounded-sm border border-white/5 overflow-hidden flex flex-col justify-end p-4">
                                <video 
                                    src={url} 
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" 
                                    muted 
                                    loop 
                                    playsInline 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Cinema Asset {i + 1}</span>
                                    <button 
                                        onClick={() => updateHeroVideos(heroVideos.filter((_, idx) => idx !== i))}
                                        className="w-6 h-6 bg-black/80 rounded-sm flex items-center justify-center text-white hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logistics Card */}
                <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center">
                            <Truck className="w-5 h-5 text-brand-yellow" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-[2px] border ${settings.logistics ? "text-brand-yellow border-brand-yellow/20 bg-brand-yellow/5" : "text-neutral-700 border-neutral-800 bg-black"}`}>
                            {settings.logistics ? "Database Master" : "Default / Local"}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Shipping Logistics</h3>
                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">Control global delivery rules and preparation buffers.</p>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black text-white/30 tracking-widest">Free Shipping Over (€)</label>
                                <input 
                                    type="number" 
                                    defaultValue={(settings.logistics?.free_shipping_threshold_cents || 15000) / 100}
                                    onBlur={(e) => updateLogistics("free_shipping_threshold_cents", Number(e.target.value) * 100)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-3 text-[11px] font-black text-white focus:border-brand-yellow/20 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-black text-white/30 tracking-widest">Prep Buffer (Days)</label>
                                <input 
                                    type="number"
                                    defaultValue={settings.logistics?.preparation_days_buffer || 2}
                                    onBlur={(e) => updateLogistics("preparation_days_buffer", Number(e.target.value))}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-3 text-[11px] font-black text-white focus:border-brand-yellow/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Algorithms Card */}
                <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center">
                            <Scale className="w-5 h-5 text-brand-yellow" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-[2px] border ${settings.pricing ? "text-brand-yellow border-brand-yellow/20 bg-brand-yellow/5" : "text-neutral-700 border-neutral-800 bg-black"}`}>
                            {settings.pricing ? "Database Master" : "Default / Local"}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Pricing Algorithms</h3>
                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">Manage dynamic multipliers for scale and finishing variants.</p>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="space-y-4">
                            <label className="text-[9px] uppercase font-black text-white/30 tracking-widest block">Scale Multipliers (Base Ref: 1/12)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["1/9", "1/6", "1/4"].map((scale) => (
                                    <div key={scale} className="bg-white/[0.02] border border-white/5 p-2 rounded-sm text-center">
                                        <p className="text-[8px] font-black text-neutral-700 uppercase mb-1">{scale}</p>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            defaultValue={(settings.pricing?.scales as any)?.[scale]?.multiplier || (scale === "1/9" ? 1.5 : scale === "1/6" ? 2.5 : 5.0)}
                                            onBlur={(e) => updatePricingMultiplier("scales", scale, Number(e.target.value))}
                                            className="w-full bg-transparent text-center text-[10px] font-black text-brand-yellow outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] uppercase font-black text-white/30 tracking-widest block">Finish Multipliers</label>
                            <div className="grid grid-cols-2 gap-2">
                                {["painted", "raw"].map((finish) => (
                                    <div key={finish} className="bg-white/[0.02] border border-white/5 p-2 rounded-sm text-center">
                                        <p className="text-[8px] font-black text-neutral-700 uppercase mb-1">{finish}</p>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            defaultValue={(settings.pricing?.finishes as any)?.[finish]?.multiplier || (finish === "painted" ? 1.0 : 0.6)}
                                            onBlur={(e) => updatePricingMultiplier("finishes", finish, Number(e.target.value))}
                                            className="w-full bg-transparent text-center text-[10px] font-black text-white outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Cards (System Info) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-60">
                <div className="bg-[#0a0a0a] border border-white/5 p-10 border-dashed">
                    <div className="flex items-center gap-4 mb-4">
                        <ShieldCheck className="w-5 h-5 text-neutral-700" />
                        <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest">System Security</h3>
                    </div>
                    <p className="text-[9px] font-bold text-neutral-800 uppercase tracking-widest">Verify Stripe webhooks and Supabase connectivity status.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-10 border-dashed">
                    <div className="flex items-center gap-4 mb-4">
                        <Database className="w-5 h-5 text-neutral-700" />
                        <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest">Database Sync</h3>
                    </div>
                    <p className="text-[9px] font-bold text-neutral-800 uppercase tracking-widest">Manual snapshot of product catalog and order history uplink.</p>
                </div>
            </div>

            {loading && (
                <div className="fixed top-8 right-8 bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-sm flex items-center gap-3 z-[100] animate-in fade-in duration-300">
                    <Loader2 className="w-4 h-4 text-brand-yellow animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Projecting to Database...</span>
                </div>
            )}
        </div>
    );
}
