"use client";

import { useState, useEffect, useRef } from "react";
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
    EyeOff,
    Sparkles,
    Zap,
    Archive,
    GitCommit,
    ArrowRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MultiLanguageEditor from "@/components/admin/MultiLanguageEditor";
import ImageCropper from "@/components/admin/ImageCropper";

interface ProductFormProps {
    initialData?: any;
}

export default function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isMediaUploading, setIsMediaUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Cropping flow state
    const [cropQueue, setCropQueue] = useState<File[]>([]);
    const [isCropping, setIsCropping] = useState(false);

    // Form State
    const [id, setId] = useState(initialData?.id || "");
    const [names, setNames] = useState<Record<string, string | null>>({
        en: initialData?.name_en || initialData?.name || "",
        it: initialData?.name_it || null,
        de: initialData?.name_de || null,
        fr: initialData?.name_fr || null,
        es: initialData?.name_es || null,
        nl: initialData?.name_nl || null,
        ru: initialData?.name_ru || null,
        tr: initialData?.name_tr || null,
        pt: initialData?.name_pt || null,
        ja: initialData?.name_ja || null,
        ar: initialData?.name_ar || null,
        pl: initialData?.name_pl || null,
    });
    const [descriptions, setDescriptions] = useState<Record<string, string | null>>({
        en: initialData?.description_en || initialData?.description || null,
        it: initialData?.description_it || null,
        de: initialData?.description_de || null,
        fr: initialData?.description_fr || null,
        es: initialData?.description_es || null,
        nl: initialData?.description_nl || null,
        ru: initialData?.description_ru || null,
        tr: initialData?.description_tr || null,
        pt: initialData?.description_pt || null,
        ja: initialData?.description_ja || null,
        ar: initialData?.description_ar || null,
        pl: initialData?.description_pl || null,
    });
    const [price, setPrice] = useState(initialData?.price || 8999);
    const [complexityFactor, setComplexityFactor] = useState(initialData?.complexityFactor || 1.0);
    const [isAnalyzingComplexity, setIsAnalyzingComplexity] = useState(false);
    const [category, setCategory] = useState(initialData?.category || "figures");
    const [franchise, setFranchise] = useState(initialData?.franchise || "");
    const [subcategory, setSubcategory] = useState(initialData?.subcategory || "");
    const [status, setStatus] = useState<"draft" | "published" | "archived">(initialData?.status || "published");
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState("");
    const [newCat, setNewCat] = useState("");
    const [newSub, setNewSub] = useState("");
    
    // Taxonomy Context
    const [allExistingTags, setAllExistingTags] = useState<string[]>([]);
    const [allExistingFranchises, setAllExistingFranchises] = useState<string[]>([]);
    const [allExistingSubcategories, setAllExistingSubcategories] = useState<string[]>([]);
    
    // AI Suggestions Data
    const [suggestedPairs, setSuggestedPairs] = useState<Record<string, string>>({});
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isTagSuggestionsOpen, setIsTagSuggestionsOpen] = useState(false);

    // AI Generator State
    const [isForging, setIsForging] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationProgress, setTranslationProgress] = useState(0);
    const abortTranslationRef = useRef(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [autoTranslate, setAutoTranslate] = useState(true);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const categories = [
        { value: "figures", label: "Collector Figure", icon: Shield, desc: "Standard 1/9 to 1/4 scales" },
        { value: "busts", label: "Museum Bust", icon: Box, desc: "High-detail portrait sculpts" },
        { value: "dioramas", label: "Diorama Set", icon: Package, desc: "Complete environment scenes" }
    ];
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [videos, setVideos] = useState<string[]>(initialData?.videos || []);

    const supabase = createClient();

    useEffect(() => {
        // Fetch all unique taxonomy data on mount
        const fetchTaxonomy = async () => {
            const { data } = await supabase.from("products").select("tags, franchise, subcategory") as { data: { tags: string[], franchise: string, subcategory: string }[] | null };
            if (data) {
                const uniqueTags = Array.from(new Set(data.flatMap(p => p.tags || []))).sort();
                const uniqueFranchises = Array.from(new Set(data.map(p => p.franchise).filter(Boolean))).sort();
                const uniqueSubcategories = Array.from(new Set(data.map(p => p.subcategory).filter(Boolean))).sort();
                
                setAllExistingTags(uniqueTags);
                setAllExistingFranchises(uniqueFranchises);
                setAllExistingSubcategories(uniqueSubcategories);
            }
        };
        fetchTaxonomy();
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

    const removeTag = async (tagToRemove: string) => {
        const nextTags = tags.filter(t => t !== tagToRemove);
        setTags(nextTags);
        
        // Immediate Sync: If editing established data, strip the tag from the database record immediately
        // to prevent sync drift and satisfy the 'actual removal' protocol
        if (initialData?.id) {
            try {
                await axios.patch(`/api/admin/products/${initialData.id}`, { tags: nextTags });
                showToast(`Tag '${tagToRemove}' purged from archive`, 'success');
            } catch (err) {
                console.error("Discovery: Failed to purge tag from master record", err);
            }
        }
    };

    const handleUploadSingle = async (file: File, type: 'images' | 'videos') => {
        setIsMediaUploading(true);
        setError(null);
        
        try {
            // 10MB Size Guard (redundant check but safe)
            if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} exceeds 10MB limit`);

            const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
            const fileName = `${Math.random()}.${fileExt}`;
            const folder = type === 'images' ? 'products' : 'cinematics';
            const filePath = `${folder}/${fileName}`;

            const uploadOptions = {
                upsert: true,
                contentType: file.type || 'image/jpeg',
            };

            const { error: uploadError } = await supabase.storage
                .from('product-media')
                .upload(filePath, file, uploadOptions);

            let targetBucket = 'product-media';

            if (uploadError) {
                // Fallback attempt
                const { error: fallbackError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file, uploadOptions);

                if (fallbackError) {
                    throw new Error(`Upload failed for ${file.name || 'cropped image'}. Ref: ${uploadError.message}`);
                }
                targetBucket = 'product-images';
            }

            const { data: { publicUrl } } = supabase.storage
                .from(targetBucket)
                .getPublicUrl(filePath);

            if (type === 'images') setImages(prev => [...prev, publicUrl]);
            else setVideos(prev => [...prev, publicUrl]);

        } catch (err: any) {
            console.error("[MediaUpload] Single upload error:", err);
            setError(err.message);
        } finally {
            setIsMediaUploading(false);
            setUploadProgress(0);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'videos') => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (type === 'images') {
            // Initialize cropping flow for images
            setCropQueue(files);
            setIsCropping(true);
            return;
        }

        // Standard direct upload for videos
        setIsMediaUploading(true);
        setError(null);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const baseProgress = (i / files.length) * 100;
                setUploadProgress(Math.max(1, Math.round(baseProgress)));
                
                await handleUploadSingle(file, type);
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsMediaUploading(false);
            setUploadProgress(0);
        }
    };

    const onCropDone = async (blob: Blob) => {
        const currentFile = cropQueue[0];
        if (!currentFile) return;

        // Create a File from the blob to preserve original name/metadata if possible
        const croppedFile = new File([blob], currentFile.name, { type: 'image/jpeg' });
        
        // Remove processed item from queue
        const nextQueue = cropQueue.slice(1);
        setCropQueue(nextQueue);
        
        if (nextQueue.length === 0) {
            setIsCropping(false);
        }

        // Upload to storage
        await handleUploadSingle(croppedFile, 'images');
    };

    const handleForge = async () => {
        if (!aiPrompt && images.length === 0) {
            showToast("Provide an image or prompt for the Forge", 'error');
            return;
        }

        setIsForging(true);
        setError(null);
        const t_start = Date.now();
        console.log("[AI Forge] --- NEXUS INITIATED ---");

        try {
            // If we have images, use the first one as a base64 reference for vision
            let base64Image: string | null = null;
            if (images.length > 0) {
                try {
                    const t_comp_start = Date.now();
                    // COMPRESSION ENGINE: Resize and compress for the AI Forge
                    const img = document.createElement("img");
                    img.crossOrigin = "anonymous"; // CRITICAL: Avoid CORS 'tainted canvas' errors
                    img.src = images[0];
                    
                    base64Image = await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => reject(new Error("Image compression timed out")), 5000);
                        
                        img.onload = () => {
                            clearTimeout(timeout);
                            const canvas = document.createElement("canvas");
                            const MAX_WIDTH = 512;
                            const scale = MAX_WIDTH / Math.max(img.width, 1);
                            canvas.width = MAX_WIDTH;
                            canvas.height = (img.height || 512) * scale;
                            
                            const ctx = canvas.getContext("2d");
                            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                            resolve(canvas.toDataURL("image/jpeg", 0.5).split(',')[1]);
                        };

                        img.onerror = () => {
                            clearTimeout(timeout);
                            reject(new Error("Image failed to load for compression"));
                        };
                    });
                    console.log(`[AI Forge] Telemetry: Image compressed in ${Date.now() - t_comp_start}ms. PayloadSize: ${base64Image?.length} chars`);
                } catch (e) {
                    console.warn("[AI Forge] Compression protocol failed, proceeding without vision data", e);
                }
            }

            console.log("[AI Forge] Telemetry: Dispatching Streaming Nexus Request...");
            
            // USE NATIVE FETCH FOR STREAMING
            const fetchResponse = await fetch("/api/admin/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    image: base64Image,
                    existingFranchises: allExistingFranchises,
                    existingSubcategories: allExistingSubcategories,
                    model: "google/gemma-3-27b-it"
                }),
            });

            if (!fetchResponse.ok) {
                const errData = await fetchResponse.json().catch(() => ({}));
                throw new Error(`Forge API Error: ${fetchResponse.status} ${errData.error || ""}`);
            }

            // STREAM READER PROTOCOL (Buffered to handle partial lines)
            const reader = fetchResponse.body?.getReader();
            if (!reader) throw new Error("Forge Stream Connection Failed");

            let fullContent = "";
            let buffer = ""; // CARRY-OVER BUFFER
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                const lines = buffer.split('\n');
                // Keep the last potentially incomplete line in the buffer
                buffer = lines.pop() || "";
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
                    
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const dataStr = trimmedLine.slice(6);
                            const json = JSON.parse(dataStr);
                            const text = json.choices[0]?.delta?.content || "";
                            fullContent += text;
                        } catch (e) {
                            // Partial JSON in the data payload, skip and let buffer handle if possible
                        }
                    }
                }
            }

            console.log(`[AI Forge] --- NEXUS DATA RECEIVED (${Date.now() - t_start}ms) ---`);

            // EXTRACTION ENGINE (CLEANS MARKDOWN PREAMBLE)
            const firstCurly = fullContent.indexOf('{');
            const lastCurly = fullContent.lastIndexOf('}');
            
            if (firstCurly === -1 || lastCurly === -1) {
                throw new Error("Forge response did not contain a valid JSON structure.");
            }

            // CLEAN: Remove possible newlines/spaces between marker and start of JSON
            const jsonStr = fullContent.substring(firstCurly, lastCurly + 1)
                .replace(/\\n/g, '\n') // Handle escaped newlines
                .trim();
            
            const ForgeResult = JSON.parse(jsonStr);

            const { 
                title, 
                description, 
                categorical_tags
            } = ForgeResult;

            if (title) {
                const newNames: Record<string, string | null> = { ...names, en: title };
                
                if (autoTranslate) {
                    const languages = ["it", "es", "fr", "de", "nl", "ru", "tr", "pt", "ja", "pl", "ar"];
                    for (const lang of languages) {
                        try {
                            const res = await axios.post("/api/translate", {
                                text: title,
                                targetLang: lang,
                                sourceLang: "en"
                            });
                            if (res.data.translatedText) newNames[lang] = res.data.translatedText;
                        } catch (e) {
                            console.warn(`[AI Forge] Name translation failed for ${lang}`, e);
                        }
                    }
                }
                setNames(newNames);
            }
            
            // Handle categorical suggestions
            if (categorical_tags) {
                // Filter out primary nodes (Franchise/Character) from the tag suggestion deck
                // to prevent data duplication since they are now separate database columns
                const secondaryLore: Record<string, string> = { ...categorical_tags };
                
                if (categorical_tags.Franchise) {
                    setFranchise(categorical_tags.Franchise);
                    delete secondaryLore.Franchise;
                }
                if (categorical_tags.Character) {
                    setSubcategory(categorical_tags.Character);
                    delete secondaryLore.Character;
                }
                // Allow 'Character' alias as well
                if (categorical_tags.Character) {
                    delete secondaryLore.Character;
                }

                setSuggestedPairs(secondaryLore);
            }

            if (description) {
                const newDescriptions: Record<string, string | null> = { ...descriptions, en: description };

                if (autoTranslate) {
                    setIsTranslating(true);
                    setTranslationProgress(0);
                    abortTranslationRef.current = false;
                    
                    const languages = ["it", "es", "fr", "de", "nl", "ru", "tr", "pt", "ja", "pl", "ar"];
                    for (let i = 0; i < languages.length; i++) {
                        if (abortTranslationRef.current) {
                            showToast("Translation protocol interrupted", 'error');
                            break;
                        }

                        const lang = languages[i];
                        let retries = 0;
                        let success = false;

                        while (retries < 2 && !success) { // AUTO-RETRY LOGIC
                            try {
                                const transRes = await axios.post("/api/translate", {
                                    text: description,
                                    targetLang: lang,
                                    sourceLang: "en"
                                });
                                if (transRes.data.translatedText) {
                                    newDescriptions[lang] = transRes.data.translatedText;
                                    success = true;
                                }
                            } catch (e) {
                                retries++;
                                if (retries < 2) await new Promise(r => setTimeout(r, 1000));
                            }
                        }

                        setTranslationProgress(((i + 1) / languages.length) * 100);
                    }
                }

                setDescriptions(newDescriptions);
                setIsTranslating(false);
            }
            
            // Note: We don't merge tags automatically anymore to give Admin control over quality
            // Suggestions are now displayed in the "Suggestion Deck"

        } catch (err: any) {
            console.error("[AI Forge] Fatal Error:", err);
            showToast(`Forging failed: ${err.response?.data?.error || err.message}`, 'error');
        } finally {
            setIsForging(false);
        }
    };

    const analyzeComplexity = async () => {
        if (images.length === 0) {
            showToast("No assets detected for vision analysis", 'error');
            return;
        }
        
        setIsAnalyzingComplexity(true);
        try {
            const res = await axios.post("/api/admin/ai/analyze-complexity", {
                imageUrl: images[0],
                finishType: "PAINTED" // Default for manual listing analysis
            });
            
            if (res.data.complexity_factor) {
                setComplexityFactor(res.data.complexity_factor);
                showToast(`Complexity Protocol: ${res.data.complexity_factor.toFixed(2)}x factor applied`, 'success');
            }
        } catch (err: any) {
            console.error("Complexity Analysis Error:", err);
            showToast("Complexity analysis protocol failed", 'error');
        } finally {
            setIsAnalyzingComplexity(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate at least one language has description
        const hasAtLeastOneDescription = Object.values(descriptions).some(
            (desc) => desc && desc.trim().length > 0
        );
        if (!hasAtLeastOneDescription) {
            showToast("One language description is required", 'error');
            setLoading(false);
            return;
        }

        const productData = {
            id: id || names.en!.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
            name: names.en || "",
            name_en: names.en, name_it: names.it, name_de: names.de, name_fr: names.fr, name_es: names.es,
            name_nl: names.nl, name_ru: names.ru, name_tr: names.tr, name_pt: names.pt, name_ja: names.ja, name_ar: names.ar, name_pl: names.pl,
            description: descriptions.en || Object.values(descriptions).find(d => d) || "",
            description_en: descriptions.en, description_it: descriptions.it, description_de: descriptions.de, description_fr: descriptions.fr, description_es: descriptions.es,
            description_nl: descriptions.nl, description_ru: descriptions.ru, description_tr: descriptions.tr, description_pt: descriptions.pt, description_ja: descriptions.ja, description_ar: descriptions.ar, description_pl: descriptions.pl,
            price: Number(price),
            category,
            franchise,
            subcategory,
            status,
            tags,
            images,
            videos,
            complexityFactor: Number(complexityFactor),
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
            showToast(`Save Error: ${err.response?.data?.error || err.message}`, 'error');
            setLoading(false);
        }
    };

    const deleteMediaFromStorage = async (url: string) => {
        if (!url || !url.includes('/product-media/')) return;
        
        try {
            const path = url.split('/product-media/')[1];
            if (path) {
                await supabase.storage.from('product-media').remove([path]);
            }
        } catch (err) {
            console.error("Cleanup error:", err);
        }
    };

    const removeImage = (index: number) => {
        const urlToRemove = images[index];
        setImages(images.filter((_, i) => i !== index));
        if (urlToRemove) deleteMediaFromStorage(urlToRemove);
    };

    const removeVideo = (index: number) => {
        const urlToRemove = videos[index];
        setVideos(videos.filter((_, i) => i !== index));
        if (urlToRemove) deleteMediaFromStorage(urlToRemove);
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

                    {/* Image Cropping Engine Overlay */}
                    {isCropping && cropQueue.length > 0 && (
                        <ImageCropper
                            file={cropQueue[0]}
                            onCropComplete={onCropDone}
                            onCancel={() => {
                                setCropQueue(prev => prev.slice(1));
                                if (cropQueue.length <= 1) setIsCropping(false);
                            }}
                        />
                    )}

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
                            <button
                                type="button"
                                onClick={() => setStatus("archived")}
                                className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest flex items-center gap-2 rounded-sm transition-all ${status === "archived" ? "bg-red-500/20 text-red-500" : "text-neutral-600 hover:text-neutral-400"}`}
                            >
                                <Archive className="w-3 h-3" />
                                Archived
                            </button>
                        </div>
                    </div>

                    {/* AI FORGE SYSTEM */}
                    <div className="bg-brand-yellow/5 border border-brand-yellow/10 rounded-sm p-8 space-y-6 relative overflow-hidden group/forge">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/forge:opacity-20 transition-opacity">
                            <Sparkles className="w-16 h-16 text-brand-yellow" />
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-brand-yellow text-black rounded-sm shadow-[0_0_15px_rgba(255,159,0,0.3)]">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-brand-yellow">AI Forge Unit</h4>
                                <p className="text-[8px] uppercase font-bold text-neutral-500 tracking-tighter">Automated master crafting protocol enabled</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="Enter subject details (e.g. 'Cyberpunk female assassin with metallic wings') or leave empty to forge from uploaded images..."
                                    className="w-full bg-black/40 border border-white/5 rounded-sm p-4 text-[11px] font-bold text-white focus:outline-none focus:border-brand-yellow/30 min-h-[80px] resize-none pr-20"
                                />
                                <div className="absolute bottom-4 right-4 text-[8px] uppercase font-black text-neutral-700 tracking-widest">
                                    MOONLIGHT KIMI K2.5
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                    <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${autoTranslate ? 'bg-brand-yellow/20' : 'bg-white/5'}`}>
                                        <div className={`w-3 h-3 rounded-full transition-all ${autoTranslate ? 'bg-brand-yellow translate-x-4 shadow-[0_0_8px_rgba(255,159,0,0.5)]' : 'bg-neutral-700 translate-x-0'}`} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={autoTranslate}
                                        onChange={(e) => setAutoTranslate(e.target.checked)}
                                    />
                                    <span className="text-[9px] uppercase font-black tracking-widest text-neutral-500 group-hover/toggle:text-neutral-300 transition-colors">
                                        Auto-Generate Global Translations
                                    </span>
                                </label>

                                <div className="flex items-center gap-6">
                                    {isTranslating && (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <div className="flex items-center justify-between text-[8px] uppercase font-black tracking-widest text-[#df9e55]">
                                                <span>Syncing Global Markets</span>
                                                <span className="font-bold">{Math.round(translationProgress)}%</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${translationProgress}%` }}
                                                    className="h-full bg-[#df9e55] shadow-[0_0_8px_rgba(223,158,85,0.4)]"
                                                />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    abortTranslationRef.current = true;
                                                    setIsTranslating(false);
                                                }}
                                                className="text-[7px] uppercase font-black text-neutral-600 hover:text-red-500 transition-colors self-end"
                                            >
                                                Protocol Interrupt [X]
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        disabled={isForging || isTranslating || (!aiPrompt && images.length === 0)}
                                        onClick={handleForge}
                                        className="px-8 py-3 bg-brand-yellow text-black text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-[#ffaa22] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-3 shadow-[0_4px_15px_rgba(255,159,0,0.2)]"
                                    >
                                        {isForging ? (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Forging...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-3 h-3" />
                                                Forge Masterpiece
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {images.length > 0 && (
                            <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 border border-brand-yellow/30 rounded-sm overflow-hidden relative">
                                    <Image src={images[0]} alt="Ref" fill className="object-cover opacity-50" />
                                </div>
                                <span className="text-[8px] uppercase font-black text-brand-yellow/60 tracking-widest animate-pulse">
                                    VISION PROTOCOL: 01 ASSET DETECTED
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Subject Name (EN)</label>
                            <input
                                required
                                value={names.en || ""}
                                onChange={(e) => setNames({ ...names, en: e.target.value })}
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
                        <MultiLanguageEditor
                            descriptions={descriptions}
                            onChange={setDescriptions}
                            labels={{
                                title: "Multi-Language Description",
                                placeholder: "Describe the intricate details and craftsmanship...",
                                unsavedChanges: "You have unsaved changes in the current language tab. Do you want to discard them?",
                                atLeastOneRequired: "At least one language description is required"
                            }}
                            required={true}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
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

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500">Complexity Factor</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1.0"
                                    max="1.3"
                                    required
                                    value={complexityFactor}
                                    onChange={(e) => setComplexityFactor(Number(e.target.value))}
                                    className="flex-1 bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black text-white focus:outline-none focus:border-brand-yellow/30"
                                />
                                <button
                                    type="button"
                                    onClick={analyzeComplexity}
                                    disabled={isAnalyzingComplexity || images.length === 0}
                                    className="p-4 bg-white/5 hover:bg-white/10 transition-all rounded-sm border border-white/5 group flex items-center justify-center min-w-[3rem]"
                                    title="AI Complexity Insight"
                                >
                                    {isAnalyzingComplexity ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-brand-yellow" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 text-brand-yellow group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </div>
                            <p className="text-[9px] font-black uppercase text-neutral-700">Multiplier applied: {complexityFactor.toFixed(2)}x total</p>
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

                        <div className="md:col-span-3 flex items-center gap-6 py-6 px-6 bg-white/[0.01] border border-white/5 rounded-sm relative overflow-hidden group/nexus">
                            {/* Animated Background Pulse */}
                            <div className="absolute inset-0 bg-brand-yellow/[0.01] opacity-0 group-hover/nexus:opacity-100 transition-opacity duration-1000" />
                            
                            {/* Left Node: Franchise */}
                            <div className="flex-1 space-y-3 relative z-10">
                                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Franchise / Universe</label>
                                <div className="relative group/field">
                                    <input
                                        value={franchise}
                                        onChange={(e) => setFranchise(e.target.value)}
                                        placeholder="e.g. DC Comics"
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-sm p-4 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/30 transition-all pr-12"
                                    />
                                    {franchise && (
                                        <button 
                                            type="button"
                                            onClick={async () => {
                                                setFranchise("");
                                                if (initialData?.id) {
                                                    await axios.patch(`/api/admin/products/${initialData.id}`, { franchise: null });
                                                    showToast("Franchise decoupled from archive", 'success');
                                                }
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-red-500 transition-all opacity-0 group-hover/field:opacity-100"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-yellow rounded-full shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                                </div>
                            </div>

                            {/* Center Connector */}
                            <div className="flex flex-col items-center justify-center gap-1 group/connector pt-6">
                                <div className="w-12 h-[2px] bg-gradient-to-r from-brand-yellow/40 to-cyan-500/40 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
                                        <GitCommit className="w-2.5 h-2.5 text-brand-yellow animate-pulse" />
                                    </div>
                                </div>
                                <span className="text-[8px] font-black uppercase text-neutral-700 tracking-[0.2em]">Linking</span>
                            </div>

                            {/* Right Node: Subcategory */}
                            <div className="flex-1 space-y-3 relative z-10">
                                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Subject Character / Series</label>
                                <div className="relative group/field">
                                    <input
                                        value={subcategory}
                                        onChange={(e) => setSubcategory(e.target.value)}
                                        placeholder="e.g. Zatanna"
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-sm p-4 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/30 transition-all pr-12"
                                    />
                                    {subcategory && (
                                        <button 
                                            type="button"
                                            onClick={async () => {
                                                setSubcategory("");
                                                if (initialData?.id) {
                                                    await axios.patch(`/api/admin/products/${initialData.id}`, { subcategory: null });
                                                    showToast("Subject decoupled from archive", 'success');
                                                }
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-red-500 transition-all opacity-0 group-hover/field:opacity-100"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 mt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5" />
                                Hierarchical Taxonomy (Categorical Tags)
                            </label>
                            
                            <div className="relative group/legend">
                                <AlertCircle className="w-4 h-4 text-neutral-700 cursor-help hover:text-brand-yellow transition-colors" />
                                <div className="absolute bottom-full right-0 mb-4 w-72 bg-black border border-white/10 p-4 rounded-sm shadow-2xl scale-90 opacity-0 group-hover/legend:scale-100 group-hover/legend:opacity-100 transition-all z-[100] pointer-events-none">
                                    <h5 className="text-[10px] font-black uppercase text-white mb-3 tracking-widest border-b border-white/5 pb-2">Hierarchy Protocol</h5>
                                    <div className="space-y-3">
                                        <p className="text-[8px] font-bold text-neutral-400 uppercase leading-relaxed">Every tag must belong to a parent category. Format: <span className="text-brand-yellow">Category</span> &rarr; <span className="text-cyan-500">Subcategory</span>.</p>
                                        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                            <div className="w-2 h-2 rounded-full bg-brand-yellow shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                                            <span className="text-[7px] font-bold text-neutral-500 uppercase tracking-widest">Vault Category</span>
                                            <ArrowRight className="w-2.5 h-2.5 text-neutral-800" />
                                            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                            <span className="text-[7px] font-bold text-neutral-500 uppercase tracking-widest">Local Subject</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categorical Tag Cloud */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {tags.map((tag) => {
                                const [cat, sub] = tag.includes(':') ? tag.split(':') : ['Other', tag];
                                return (
                                    <div key={tag} className="flex items-center bg-white/[0.03] border border-white/10 rounded-sm overflow-hidden animate-in zoom-in duration-300">
                                        <span className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-brand-yellow/80 bg-brand-yellow/5 border-r border-white/5">{cat}</span>
                                        <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                                            {sub}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-red-500 transition-colors p-0.5"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Suggestion Deck (Categorical) */}
                        {Object.keys(suggestedPairs).length > 0 && (
                            <div className="bg-white/[0.01] border-l-2 border-brand-yellow border border-white/5 p-5 mb-8 rounded-sm space-y-4 animate-in slide-in-from-top-4 duration-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase text-neutral-500 tracking-widest flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-brand-yellow" />
                                        Forge Proposed Taxonomy
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => setSuggestedPairs({})}
                                        className="text-[8px] font-black text-neutral-700 uppercase hover:text-white transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {Object.entries(suggestedPairs).map(([cat, sub]) => (
                                        <button
                                            key={`${cat}-${sub}`}
                                            type="button"
                                            onClick={() => {
                                                const tagStr = `${cat}:${sub}`;
                                                if (!tags.includes(tagStr)) {
                                                    setTags([...tags, tagStr]);
                                                }
                                                const newPairs = { ...suggestedPairs };
                                                delete newPairs[cat];
                                                setSuggestedPairs(newPairs);
                                            }}
                                            className="group flex items-center bg-white/[0.05] border border-white/10 rounded-sm overflow-hidden hover:border-brand-yellow/40 transition-all hover:translate-y-[-2px] hover:shadow-xl"
                                        >
                                            <span className="px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-brand-yellow transition-colors border-r border-white/5">{cat}</span>
                                            <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-300 group-hover:text-white flex items-center gap-2">
                                                {sub as string}
                                                <Zap className="w-2.5 h-2.5 text-brand-yellow/30 group-hover:text-brand-yellow animate-pulse" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manual Categorical Input */}
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm flex flex-col md:flex-row items-end gap-4 shadow-inner">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Parent Category</label>
                                <input
                                    value={newCat}
                                    onChange={(e) => setNewCat(e.target.value)}
                                    placeholder="e.g. Artist"
                                    className="w-full bg-black/20 border border-white/5 rounded-sm p-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/20"
                                />
                            </div>
                            <div className="flex items-center justify-center pt-6 opacity-20">
                                <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Local Subject</label>
                                <input
                                    value={newSub}
                                    onChange={(e) => setNewSub(e.target.value)}
                                    placeholder="e.g. Artgerm"
                                    className="w-full bg-black/20 border border-white/5 rounded-sm p-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/20"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (newCat && newSub) {
                                                setTags([...tags, `${newCat}:${newSub}`]);
                                                setNewCat("");
                                                setNewSub("");
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (newCat && newSub) {
                                        setTags([...tags, `${newCat}:${newSub}`]);
                                        setNewCat("");
                                        setNewSub("");
                                    }
                                }}
                                className="bg-white/5 border border-white/10 p-3 rounded-sm hover:bg-white/10 hover:border-brand-yellow/30 transition-all font-black text-xs uppercase text-brand-yellow flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Link
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

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50, x: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }}
                        className="fixed bottom-8 right-8 z-[100] min-w-[320px] pointer-events-none"
                    >
                        <div className={`
                            relative overflow-hidden p-6 rounded-sm border backdrop-blur-xl shadow-2xl
                            ${toast.type === 'error' 
                                ? 'bg-red-500/10 border-red-500/20' 
                                : 'bg-brand-yellow/10 border-brand-yellow/20'}
                        `}>
                            {/* Blop Background Glow */}
                            <div className={`
                                absolute -inset-20 opacity-20 blur-3xl rounded-full
                                ${toast.type === 'error' ? 'bg-red-500' : 'bg-brand-yellow'}
                            `} />

                            <div className="relative flex items-center gap-4">
                                <div className={`
                                    p-3 rounded-sm
                                    ${toast.type === 'error' ? 'bg-red-500' : 'bg-brand-yellow'}
                                `}>
                                    {toast.type === 'error' ? (
                                        <AlertCircle className="w-4 h-4 text-black" />
                                    ) : (
                                        <Zap className="w-4 h-4 text-black" />
                                    )}
                                </div>
                                <div>
                                    <h5 className={`
                                        text-[10px] uppercase font-black tracking-widest mb-1
                                        ${toast.type === 'error' ? 'text-red-400' : 'text-brand-yellow'}
                                    `}>
                                        System Alert
                                    </h5>
                                    <p className="text-[11px] font-bold text-white tracking-tight leading-relaxed">
                                        {toast.message}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setToast(null)}
                                    className="ml-auto p-2 hover:bg-white/5 rounded-full pointer-events-auto transition-colors"
                                >
                                    <X className="w-3 h-3 text-neutral-500" />
                                </button>
                            </div>

                            {/* Self-Destruct Progress Bar */}
                            <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className={`
                                    absolute bottom-0 left-0 h-0.5
                                    ${toast.type === 'error' ? 'bg-red-500' : 'bg-brand-yellow'}
                                `}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
