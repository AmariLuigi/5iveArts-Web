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
    Film,
    MessageSquare,
    UserCircle,
    Trash2,
    Quote,
    Image as LibraryIcon
} from "lucide-react";
import { SiteSettings, Testimonial } from "@/lib/settings";
import { Product } from "@/types";
import { createClient } from "@/lib/supabase-browser";

interface Props {
    initialSettings: SiteSettings;
}

const AVATAR_LIBRARY = [
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Felix&backgroundColor=ff9f00&radius=50",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Aneka&backgroundColor=ff9f00&radius=50",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Leo&backgroundColor=ff9f00&radius=50",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Maya&backgroundColor=ff9f00&radius=50",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Zoe&backgroundColor=ff9f00&radius=50",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Jasper&backgroundColor=ff9f00&radius=50",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Luna&backgroundColor=ff9f00&radius=50",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Finn&backgroundColor=ff9f00&radius=50"
];

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
    const [activeTab, setActiveTab] = useState<'visual' | 'engine'>('visual');

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
            setSettings(prev => ({ ...prev, [key]: value } as SiteSettings));
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

    const updateTestimonials = (list: Testimonial[]) => {
        const newHomepage = {
            ...(settings.homepage || { featured_product_ids: [], hero_videos: [] }),
            testimonials: list
        };
        handleSave("homepage", newHomepage);
    };

    const selectedFeaturedIds = settings.homepage?.featured_product_ids || [];
    const selectedProducts = allProducts.filter(p => selectedFeaturedIds.includes(p.id));
    const suggestedProducts = productSearch.length > 0 
        ? allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && !selectedFeaturedIds.includes(p.id)).slice(0, 5)
        : [];
    
    const heroVideos = settings.homepage?.hero_videos || [];
    const testimonials = settings.homepage?.testimonials || [];

    return (
        <div className="space-y-12 pb-20">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 py-10 border-b border-white/5">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Vault Management</h2>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">System Configuration & Artisan Curation Suite</p>
                </div>
                
                <div className="flex p-1 bg-white/[0.02] border border-white/5 rounded-sm">
                    <button 
                        onClick={() => setActiveTab('visual')}
                        className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm ${activeTab === 'visual' ? "bg-brand-yellow text-black" : "text-neutral-500 hover:text-white"}`}
                    >
                        Storefront Visuals
                    </button>
                    <button 
                        onClick={() => setActiveTab('engine')}
                        className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest transition-all rounded-sm ${activeTab === 'engine' ? "bg-brand-yellow text-black" : "text-neutral-500 hover:text-white"}`}
                    >
                        Commerce Engine
                    </button>
                </div>
            </div>

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

            {activeTab === 'visual' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                    {/* Home Gallery Card */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden md:col-span-2">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center">
                                <Star className="w-5 h-5 text-brand-yellow" />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="max-w-xl">
                                <h3 className="text-xl font-black uppercase text-white mb-2">Home Gallery Curation</h3>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Select three masterpieces to define the visual entrance to the vault.</p>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                                <input type="text" placeholder="SEARCH VAULT..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-[10px] font-black text-white focus:border-brand-yellow/20 outline-none" />
                                {suggestedProducts.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 z-50 shadow-2xl rounded-sm">
                                        {suggestedProducts.map(product => (
                                            <button key={product.id} onClick={() => { if (selectedFeaturedIds.length >= 3) { setError("Max 3 allowed."); return; } updateHomepageFeatured([...selectedFeaturedIds, product.id]); setProductSearch(""); }} className="w-full text-left p-4 hover:bg-white/5 flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden">{product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover grayscale" />}</div>
                                                <p className="text-[10px] font-black text-white uppercase">{product.name}</p>
                                                <Plus className="ml-auto w-4 h-4 text-neutral-800" />
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
                                    <div key={i} className="group relative aspect-[3/4] bg-white/[0.02] border border-white/5 rounded-sm overflow-hidden flex flex-col items-center justify-center p-8">
                                        {product ? (
                                            <>
                                                <div className="absolute inset-0">
                                                    {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700" />}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                                </div>
                                                <div className="relative z-10">
                                                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-brand-yellow mb-2 block">Slot 0{i+1}</span>
                                                    <h4 className="text-sm font-black uppercase text-white mb-1">{product.name}</h4>
                                                </div>
                                                <button onClick={() => updateHomepageFeatured(selectedFeaturedIds.filter(id => id !== product.id))} className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/80 flex items-center justify-center text-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <Plus className="w-5 h-5 text-neutral-800 mx-auto mb-4" />
                                                <p className="text-[9px] font-black uppercase text-neutral-800">Pending</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hero Media Card */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden md:col-span-2">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center"><MonitorPlay className="w-5 h-5 text-brand-yellow" /></div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <h3 className="text-xl font-black uppercase text-white mb-2">Hero Media</h3>
                            <label className="flex items-center gap-3 px-6 py-4 bg-white/[0.03] border border-white/5 rounded-sm cursor-pointer hover:bg-white/[0.05]">
                                <Upload className="w-4 h-4 text-brand-yellow" /><span className="text-[10px] font-black uppercase text-white">Upload Cinema</span>
                                <input type="file" accept="video/*" className="hidden" onChange={handleHeroVideoUpload} disabled={uploading} />
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8 border-t border-white/5">
                            {heroVideos.map((url, i) => (
                                <div key={i} className="group relative aspect-video bg-black rounded-sm border border-white/5 overflow-hidden">
                                    <video src={url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" muted loop playsInline />
                                    <button onClick={() => updateHeroVideos(heroVideos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 z-20 w-6 h-6 bg-black/80 text-white rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonials Card */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden md:col-span-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase text-white">Collector Voices</h3>
                            <button onClick={() => updateTestimonials([...testimonials, { name: "NEW COLLECTOR", role: "Collector", quote: "...", rating: 5, avatar: AVATAR_LIBRARY[0] }])} className="px-6 py-3 bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase text-white hover:bg-white/[0.05]">ADD STORY</button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                            {testimonials.map((testi, i) => (
                                <div key={i} className="bg-white/[0.01] border border-white/5 p-8 rounded-sm space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-yellow/20"><img src={testi.avatar} alt="" className="w-full h-full object-cover" /></div>
                                            <div className="flex gap-1">{AVATAR_LIBRARY.map((img, idx) => (
                                                <button key={idx} onClick={() => { const nl = [...testimonials]; nl[i].avatar = img; updateTestimonials(nl); }} className={`w-5 h-5 rounded-full border ${testi.avatar === img ? "border-brand-yellow" : "border-white/5 opacity-40"}`}><img src={img} className="w-full h-full object-cover rounded-full" /></button>
                                            ))}</div>
                                        </div>
                                        <button onClick={() => updateTestimonials(testimonials.filter((_, idx) => idx !== i))} className="text-neutral-800 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <input value={testi.name} onChange={(e) => { const nl = [...testimonials]; nl[i].name = e.target.value; updateTestimonials(nl); }} className="w-full bg-black/20 border border-white/5 p-3 text-[10px] font-black text-white uppercase outline-none" placeholder="NAME" />
                                    <textarea value={testi.quote} onChange={(e) => { const nl = [...testimonials]; nl[i].quote = e.target.value; updateTestimonials(nl); }} className="w-full bg-black/20 border border-white/5 p-4 text-[10px] text-neutral-400 min-h-[80px] outline-none" placeholder="QUOTE" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                    {/* Logistics Card */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center"><Truck className="w-5 h-5 text-brand-yellow" /></div>
                        </div>
                        <h3 className="text-xl font-black uppercase text-white">Shipping Logistics</h3>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase text-neutral-600">Threshold (€)</label>
                                <input type="number" defaultValue={(settings.logistics?.free_shipping_threshold_cents || 15000) / 100} onBlur={(e) => updateLogistics("free_shipping_threshold_cents", Number(e.target.value) * 100)} className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-[11px] font-black text-brand-yellow" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[9px] font-black uppercase text-neutral-600">Buffer (Days)</label>
                                <input type="number" defaultValue={settings.logistics?.preparation_days_buffer || 2} onBlur={(e) => updateLogistics("preparation_days_buffer", Number(e.target.value))} className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-[11px] font-black text-brand-yellow" />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-10 flex flex-col gap-8 relative overflow-hidden md:col-span-2">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center"><Scale className="w-5 h-5 text-brand-yellow" /></div>
                        </div>
                        <h3 className="text-xl font-black uppercase text-white">Pricing Algorithms</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                            <div className="space-y-4">
                                <h4 className="text-[8px] font-black text-white/30 uppercase tracking-widest">Scales</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {["1/9", "1/6", "1/4"].map(s => (
                                        <div key={s} className="bg-white/[0.01] border border-white/5 p-4 rounded-sm">
                                            <label className="text-[7px] font-black text-neutral-700 block mb-2">{s}</label>
                                            <input type="number" step="0.1" defaultValue={(settings.pricing?.scales as any)?.[s]?.multiplier} onBlur={(e) => updatePricingMultiplier("scales", s, Number(e.target.value))} className="w-full bg-transparent text-center text-[11px] font-black text-brand-yellow outline-none" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[8px] font-black text-white/30 uppercase tracking-widest">Finishes</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {["painted", "raw"].map(f => (
                                        <div key={f} className="bg-white/[0.01] border border-white/5 p-4 rounded-sm">
                                            <label className="text-[7px] font-black text-neutral-700 block mb-2">{f}</label>
                                            <input type="number" step="0.1" defaultValue={(settings.pricing?.finishes as any)?.[f]?.multiplier} onBlur={(e) => updatePricingMultiplier("finishes", f, Number(e.target.value))} className="w-full bg-transparent text-center text-[11px] font-black text-brand-yellow outline-none" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Operational Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-40">
                <div className="bg-[#0a0a0a] border border-white/5 p-10 border-dashed rounded-sm">
                    <p className="text-[8px] font-black uppercase text-neutral-700">System Monitoring — Credentials Secured</p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-10 border-dashed rounded-sm">
                    <p className="text-[8px] font-black uppercase text-neutral-700">Vault Database — Connection Stable</p>
                </div>
            </div>

            {loading && (
                <div className="fixed top-8 right-8 bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-sm flex items-center gap-3 z-[100] animate-in slide-in-from-top-4">
                    <Loader2 className="w-3 h-3 text-brand-yellow animate-spin" /><span className="text-[8px] font-black uppercase tracking-widest text-white">Projecting...</span>
                </div>
            )}
        </div>
    );
}
