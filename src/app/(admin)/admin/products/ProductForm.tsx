"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { createClient } from "@/lib/supabase-browser";
import { formatPrice, calculatePrice } from "@/lib/products";
import {
    Package,
    Image as ImageIcon,
    Tag,
    Box,
    ChevronLeft,
    Loader2,
    Plus,
    X,
    AlertCircle,
    Save,
    Trash2,
    ChevronDown,
    Shield,
    Video,
    Film,
    Play,
    Eye,
    EyeOff
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductFormProps {
    initialData?: any;
}

export default function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isMediaUploading, setIsMediaUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [id, setId] = useState(initialData?.id || "");
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [price, setPrice] = useState(initialData?.price || 8999);
    const [category, setCategory] = useState(initialData?.category || "figures");
    const [status, setStatus] = useState<"draft" | "published">(initialData?.status || "published");
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState("");
    const [allExistingTags, setAllExistingTags] = useState<string[]>([]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isTagSuggestionsOpen, setIsTagSuggestionsOpen] = useState(false);

    const categories = [
        { value: "figures", label: "Collector Figure", icon: Shield, desc: "Standard 1/9 to 1/4 scales" },
        { value: "busts", label: "Museum Bust", icon: Box, desc: "High-detail portrait sculpts" },
        { value: "dioramas", label: "Diorama Set", icon: Package, desc: "Complete environment scenes" }
    ];
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [videos, setVideos] = useState<string[]>(initialData?.videos || []);
    const [details, setDetails] = useState<string[]>(initialData?.details || [
        "High-Resolution Industrial Resin",
        "Professional Artisan Hand-Painting",
        "Museum-Grade UV-Resistant Varnish",
        "Precision Detail Capture (0.025mm)",
        "Custom Signature Display Base",
        "Signature Foam-Padded Collector Box"
    ]);

    const supabase = createClient();

    useEffect(() => {
        // Fetch all unique tags on mount
        const fetchTags = async () => {
            const { data } = await supabase.from("products").select("tags") as { data: { tags: string[] }[] | null };
            if (data) {
                const uniqueTags = Array.from(new Set(data.flatMap(p => p.tags || []))).sort();
                setAllExistingTags(uniqueTags);
            }
        };
        fetchTags();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const suggestions = tagInput.length > 0
        ? allExistingTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
        : [];

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().toLowerCase();
            if (val && !tags.includes(val)) {
                setTags([...tags, val]);
                setTagInput("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'videos') => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsMediaUploading(true);
        setError(null);
        
        // Use a functional update to track URLs collected so far
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const folder = type === 'images' ? 'products' : 'cinematics';
                const filePath = `${folder}/${fileName}`;

                // Update progress for the current batch
                const baseProgress = (i / files.length) * 100;
                setUploadProgress(Math.max(1, Math.round(baseProgress)));

                const uploadOptions = {
                    upsert: true,
                    contentType: file.type,
                    onUploadProgress: (progress: { loaded: number; total?: number }) => {
                        if (progress.total && progress.total > 0) {
                            const currentFilePercent = (progress.loaded / progress.total) * (100 / files.length);
                            setUploadProgress(Math.min(99, Math.round(baseProgress + currentFilePercent)));
                        }
                    },
                };

                const { error: uploadError } = await supabase.storage
                    .from('product-media')
                    .upload(filePath, file, uploadOptions);

                let targetBucket = 'product-media';

                if (uploadError) {
                    const { error: fallbackError } = await supabase.storage
                        .from('product-images')
                        .upload(filePath, file, uploadOptions);

                    if (fallbackError) {
                        throw new Error(`Upload failed for ${file.name}. Ref: ${uploadError.message}`);
                    }
                    targetBucket = 'product-images';
                }

                const { data: { publicUrl } } = supabase.storage
                    .from(targetBucket)
                    .getPublicUrl(filePath);

                newUrls.push(publicUrl);
            }

            setUploadProgress(100);
            if (type === 'images') setImages([...images, ...newUrls]);
            else setVideos([...videos, ...newUrls]);

        } catch (err: any) {
            console.error("[MediaUpload] Fatal error:", err);
            setError(err.message);
            setUploadProgress(0);
        } finally {
            setIsMediaUploading(false);
            setTimeout(() => setUploadProgress(0), 1500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const productData = {
            id: id || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
            name,
            description,
            price: Number(price),
            category,
            status,
            tags,
            images,
            videos,
            details,
            updated_at: new Date().toISOString()
        };

        try {
            if (initialData) {
                await axios.patch(`/api/admin/products/${initialData.id}`, productData);
            } else {
                await axios.post("/api/admin/products", productData);
            }
            router.push("/admin/products");
            router.refresh();
        } catch (err: any) {
            console.error("[handleSubmit] Error:", err);
            setError(`Save Error: ${err.response?.data?.error || err.message}`);
            setLoading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const removeVideo = (index: number) => {
        setVideos(videos.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <form onSubmit={handleSubmit} className="space-y-12">
                {/* Top Controls */}
                <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-12">
                    <Link href="/admin/products" className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-brand-yellow transition-colors flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4" />
                        Discard & Exit
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="hasbro-btn-primary px-10 py-4 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4 text-black" />}
                        {initialData ? "Sync Masterpiece" : "Finalize & Launch"}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-sm flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-widest text-red-400">{error}</p>
                    </div>
                )}

                {(isMediaUploading || uploadProgress > 0) && (
                    <div className="bg-[#050505] border border-brand-yellow/20 p-8 rounded-sm space-y-4 mb-12">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-brand-yellow animate-spin" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-white">
                                    {uploadProgress >= 100 ? "Uplink Complete" : "Transmitting Media Assets..."}
                                </span>
                            </div>
                            <span className="text-[10px] font-black text-brand-yellow">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-yellow shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-[8px] uppercase font-bold text-neutral-600 tracking-tighter text-center">{uploadProgress >= 100 ? "Syncing with master server..." : "Do not close this window during uplink sequence"}</p>
                    </div>
                )}

                {/* Basic Info */}
                <div className="hasbro-card p-10 space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">Identity & Origins</h3>
                        <div className="flex bg-black/40 border border-white/5 rounded-sm p-1">
                            <button
                                type="button"
                                onClick={() => setStatus("draft")}
                                className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-2 rounded-sm transition-all ${status === "draft" ? "bg-white/10 text-white" : "text-neutral-600 hover:text-neutral-400"}`}
                            >
                                <EyeOff className="w-3 h-3" />
                                Draft
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus("published")}
                                className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-2 rounded-sm transition-all ${status === "published" ? "bg-brand-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]" : "text-neutral-600 hover:text-neutral-400"}`}
                            >
                                <Eye className="w-3 h-3" />
                                Published
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Subject Name</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Iron Man MK-IV"
                                className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/30"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Asset Slug (ID)</label>
                            <input
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                placeholder="Leave blank to auto-generate"
                                className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-mono text-neutral-500 focus:outline-none focus:border-brand-yellow/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Manifest Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe the intricate details and craftsmanship..."
                            className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-medium text-neutral-300 focus:outline-none focus:border-brand-yellow/30 leading-relaxed"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Base Value (Cents)</label>
                            <input
                                type="number"
                                required
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black text-brand-yellow focus:outline-none focus:border-brand-yellow/30"
                            />
                            <p className="text-[9px] font-black uppercase text-neutral-700">{formatPrice(price)} (Base 1/12 Ref Multiplier)</p>
                        </div>
                        <div className="space-y-3 relative">
                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Classification</label>

                            {/* Custom Premium Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black uppercase tracking-widest text-white flex items-center justify-between hover:border-brand-yellow/20 transition-all focus:outline-none"
                                >
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const cat = categories.find(c => c.value === category);
                                            const Icon = cat?.icon || Box;
                                            return (
                                                <>
                                                    <Icon className="w-3.5 h-3.5 text-brand-yellow" />
                                                    {cat?.label}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCategoryOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#0c0c0c] border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                                        <div className="py-2">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategory(cat.value);
                                                        setIsCategoryOpen(false);
                                                    }}
                                                    className={`w-full text-left px-5 py-4 flex flex-col transition-colors hover:bg-white/[0.03] ${category === cat.value ? 'bg-brand-yellow/[0.03]' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <cat.icon className={`w-3.5 h-3.5 ${category === cat.value ? 'text-brand-yellow' : 'text-neutral-500'}`} />
                                                        <span className={`text-[10px] uppercase font-black tracking-widest ${category === cat.value ? 'text-brand-yellow' : 'text-white'}`}>
                                                            {cat.label}
                                                        </span>
                                                        {category === cat.value && (
                                                            <div className="ml-auto w-1 h-1 bg-brand-yellow rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                                                        )}
                                                    </div>
                                                    <span className="text-[8px] uppercase font-bold text-neutral-600 tracking-tighter ml-6">
                                                        {cat.desc}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 mt-4 border-t border-white/5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" />
                            Franchise & Origins (Tags)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-2 bg-brand-yellow/10 border border-brand-yellow/30 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest text-brand-yellow group animate-in fade-in zoom-in duration-300">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-white transition-colors p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => {
                                    setTagInput(e.target.value);
                                    setIsTagSuggestionsOpen(true);
                                }}
                                onKeyDown={handleAddTag}
                                onBlur={() => setTimeout(() => setIsTagSuggestionsOpen(false), 200)}
                                placeholder="Type anime, game or show name and press Enter..."
                                className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-[11px] font-bold uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/30"
                            />
                            
                            {isTagSuggestionsOpen && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-[#0c0c0c] border border-white/10 rounded-sm shadow-2xl z-[60] overflow-hidden backdrop-blur-xl">
                                    <div className="py-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {suggestions.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => {
                                                    if (!tags.includes(suggestion)) {
                                                        setTags([...tags, suggestion]);
                                                        setTagInput("");
                                                        setIsTagSuggestionsOpen(false);
                                                    }
                                                }}
                                                className="w-full text-left px-5 py-3 text-[10px] uppercase font-black tracking-widest text-neutral-400 hover:text-brand-yellow hover:bg-white/[0.03] transition-colors flex items-center justify-between group"
                                            >
                                                {suggestion}
                                                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-[8px] uppercase font-black text-neutral-700 tracking-widest">Add series names like: "Batman", "Naruto", "Star Wars"</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Technical Specifications</label>
                        <div className="space-y-3">
                            {details.map((detail, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        value={detail}
                                        onChange={(e) => {
                                            const newDetails = [...details];
                                            newDetails[idx] = e.target.value;
                                            setDetails(newDetails);
                                        }}
                                        className="flex-1 bg-white/[0.01] border border-white/5 rounded-sm px-4 py-2 text-[11px] font-bold text-neutral-400 focus:border-brand-yellow/20 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setDetails(details.filter((_, i) => i !== idx))}
                                        className="p-2 text-neutral-800 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setDetails([...details, ""])}
                                className="text-[9px] uppercase font-black tracking-widest text-brand-yellow hover:text-white flex items-center gap-2 transition-colors mt-2"
                            >
                                <Plus className="w-3 h-3" />
                                Add Specification
                            </button>
                        </div>
                    </div>
                </div>

                {/* Visual Assets (Images) */}
                <div className="hasbro-card p-10 space-y-8">
                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 border-b border-white/5 pb-4 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-brand-yellow" />
                        Static Frames (Images)
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square bg-black border border-white/5 group rounded-sm overflow-hidden">
                                <Image src={img} alt="Product" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:text-red-500 backdrop-blur-md"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                {idx === 0 && (
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-yellow text-black text-[8px] font-black uppercase tracking-widest rounded-sm">
                                        Primary
                                    </div>
                                )}
                            </div>
                        ))}

                        <label className="aspect-square bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.04] hover:border-brand-yellow/30 transition-all group rounded-sm">
                            <Plus className="w-8 h-8 text-neutral-800 group-hover:text-brand-yellow transition-colors" />
                            <span className="text-[9px] uppercase font-black tracking-widest text-neutral-600">Add Picture</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'images')} disabled={loading} />
                        </label>
                    </div>
                </div>

                {/* Cinematic Assets (Videos) */}
                <div className="hasbro-card p-10 space-y-8">
                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 border-b border-white/5 pb-4 flex items-center gap-2">
                        <Video className="w-4 h-4 text-brand-yellow" />
                        Cinematic Reels (Videos)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {videos.map((vid, idx) => (
                            <div key={idx} className="relative aspect-video bg-black border border-white/5 group rounded-sm overflow-hidden">
                                <video
                                    key={vid}
                                    src={vid}
                                    className="w-full h-full object-cover"
                                    loop
                                    playsInline
                                    controls
                                    crossOrigin="anonymous"
                                    preload="metadata"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeVideo(idx)}
                                    className="absolute top-4 right-4 p-2 bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:text-red-500 backdrop-blur-md z-20"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <label className="aspect-video bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.04] hover:border-brand-yellow/30 transition-all group rounded-sm">
                            <Film className="w-8 h-8 text-neutral-800 group-hover:text-brand-yellow transition-colors" />
                            <span className="text-[9px] uppercase font-black tracking-widest text-neutral-600">Add Video Reel</span>
                            <input type="file" multiple accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'videos')} disabled={loading} />
                        </label>
                    </div>
                </div>

                {/* Multi-Scale Pricing Preview */}
                <div className="bg-[#050505] border border-brand-yellow/20 p-10 space-y-6 rounded-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-yellow">Algorithmic Pricing Matrix</h3>
                        <span className="text-[9px] font-black uppercase text-neutral-600">Dynamic Multipliers Enabled</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {["1/9", "1/6", "1/4"].map((s) => (
                            <div key={s} className="bg-black/50 p-4 border border-white/5 flex flex-col gap-1">
                                <span className="text-[10px] font-black text-neutral-500 uppercase">{s} Scale</span>
                                <span className="text-sm font-black text-white">{formatPrice(calculatePrice(price, s as any, "painted"))}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
}
