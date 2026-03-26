"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Star, Tag, CheckCircle, ShieldCheck, Truck, Play, Sparkles } from "lucide-react";
import { Product, ProductScale, ProductFinish } from "@/types";
import { formatPrice, calculatePrice, SCALE_CONFIG } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";
import TrustBadges from "@/components/ui/TrustBadges";
import { useSiteSettings } from "@/components/providers/SettingsProvider";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Props {
    product: Product;
    lang: string;
    dict: any;
}

const STANDARD_FEATURES = [
    "High-Resolution Industrial Resin",
    "Professional Artisan Hand-Painting",
    "Museum-Grade UV-Resistant Varnish",
    "Precision Detail Capture (0.025mm)",
    "Custom Signature Display Base",
    "Signature Foam-Padded Collector Box",
];

export default function ProductDetailClient({ product, lang, dict }: Props) {
    const { pricing } = useSiteSettings();
    const { track } = useAnalytics();
    const [selectedScale, setSelectedScale] = useState<ProductScale>("1/9");
    const [selectedFinish, setSelectedFinish] = useState<ProductFinish>("painted");
    const [activeMedia, setActiveMedia] = useState(0);
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);
    const [isMobileZoomed, setIsMobileZoomed] = useState(false);
    const [lastTap, setLastTap] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only run on desktop/hoverable devices
        if (window.matchMedia("(hover: none)").matches) return;
        
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    const handleMobileInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            // Double tap detected -> Zoom Out
            setIsMobileZoomed(false);
            setLastTap(0);
        } else {
            // Single tap -> Zoom In if not zoomed
            if (!isMobileZoomed) {
                setIsMobileZoomed(true);
            }
            setLastTap(now);
        }
    };

    const media = [
        ...(product.images || []),
        ...(product.videos || [])
    ];

    const currentPrice = calculatePrice(product.price, selectedScale, selectedFinish, pricing);

    const scales: ProductScale[] = ["1/9", "1/6", "1/4"];
    const finishes: ProductFinish[] = ["painted", "raw"];

    const isVideo = (url: string) => product.videos?.includes(url);

    // Track product_viewed once on mount
    useEffect(() => {
        track("product_viewed", {
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            base_price: product.price,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleScaleChange = (scale: ProductScale) => {
        setSelectedScale(scale);
        track("variant_selected", {
            product_id: product.id,
            dimension: "scale",
            value: scale,
            resulting_price: calculatePrice(product.price, scale, selectedFinish, pricing),
        });
    };

    const handleFinishChange = (finish: ProductFinish) => {
        setSelectedFinish(finish);
        track("variant_selected", {
            product_id: product.id,
            dimension: "finish",
            value: finish,
            resulting_price: calculatePrice(product.price, selectedScale, finish, pricing),
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Left: Media Gallery */}
                <div className="space-y-6">
                    <div className="relative aspect-square bg-[#0a0a0a] border border-white/5 overflow-hidden group rounded-sm shadow-2xl">
                        {isVideo(media[activeMedia]) ? (
                            <video
                                key={media[activeMedia]}
                                src={media[activeMedia]}
                                autoPlay
                                muted
                                loop
                                playsInline
                                crossOrigin="anonymous"
                                preload="auto"
                                className="w-full h-full object-cover transition-transform duration-700 ease-out"
                                style={{
                                    transform: isHovering ? "scale(1.2)" : "scale(1)",
                                }}
                            />
                        ) : (
                            <div 
                                className="relative w-full h-full cursor-zoom-in overflow-hidden"
                                onMouseMove={handleMouseMove}
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                                onClick={handleMobileInteraction}
                            >
                                <motion.div
                                    className="relative w-full h-full"
                                    drag={isMobileZoomed}
                                    dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                                    dragElastic={0.1}
                                    animate={{
                                        scale: isMobileZoomed ? 2.5 : (isHovering ? 1.8 : 1),
                                        x: isMobileZoomed ? undefined : 0,
                                        y: isMobileZoomed ? undefined : 0,
                                    }}
                                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                    style={{
                                        transformOrigin: isMobileZoomed ? "center" : `${zoomPos.x}% ${zoomPos.y}%`,
                                    }}
                                >
                                    <Image
                                        src={media[activeMedia] || "/images/placeholder.jpg"}
                                        alt={product.name}
                                        fill
                                        priority
                                        fetchPriority="high"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="object-contain"
                                    />
                                </motion.div>
                                
                                {/* Status Overlays */}
                                {isMobileZoomed && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 pointer-events-none z-20 shadow-2xl">
                                        <p className="text-[8px] uppercase font-black tracking-widest text-brand-yellow">Manual Panning Active [Drag to move]</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <span className={`absolute top-6 left-6 hasbro-tag flex items-center gap-1.5 shadow-2xl z-10 transition-all duration-500 ${isMobileZoomed || isHovering ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                            <Tag className="w-3.5 h-3.5" />
                            {dict?.product_detail?.handPaintedTag || "Hand-Painted & 3D Printed"}
                        </span>
                    </div>

                    {/* Thumbnails */}
                    {media.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {media.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveMedia(idx)}
                                    className={`relative aspect-square rounded-sm overflow-hidden border-2 transition-all ${activeMedia === idx
                                        ? "border-brand-yellow scale-[0.98] shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                                        : "border-white/5 hover:border-white/20 grayscale hover:grayscale-0 opacity-40 hover:opacity-100"
                                        }`}
                                >
                                    {isVideo(url) ? (
                                        <div className="w-full h-full bg-neutral-950 relative">
                                            <video
                                                src={url}
                                                className="w-full h-full object-cover opacity-80"
                                                muted
                                                playsInline
                                                preload="metadata"
                                                onMouseEnter={(e: any) => e.currentTarget.play()}
                                                onMouseLeave={(e: any) => {
                                                    e.currentTarget.pause();
                                                    e.currentTarget.currentTime = 0;
                                                }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <Play className="w-4 h-4 text-white/50" />
                                            </div>
                                        </div>
                                    ) : (
                                        <Image src={url} alt="" fill className="object-cover" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="flex flex-col pt-4">
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-3 mb-6 animate-in fade-in slide-in-from-left-4 duration-1000">
                            <span className="text-[11px] uppercase font-black tracking-[0.4em] text-brand-yellow">{product.category}</span>
                            {product.tags?.map((tag: string) => (
                                <span key={tag} className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30 border border-white/10 px-3 py-1 rounded-sm backdrop-blur-md">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.9] mb-6">
                            {product.name}
                        </h1>
                        <p className="text-4xl font-black text-white tracking-tighter">
                            {formatPrice(currentPrice)}
                        </p>
                    </div>

                    {/* Star rating */}
                    {product.rating && (
                        <div className="flex items-center gap-3 mb-10 pb-10 border-b border-white/5">
                            <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${i < Math.round(product.rating!)
                                            ? "text-brand-yellow fill-brand-yellow"
                                            : "text-white/10 fill-white/10"
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-white/40">
                                {product.rating.toFixed(1)} / 5.0
                            </span>
                            {product.reviewCount && (
                                <span className="text-xs font-black uppercase tracking-widest text-neutral-600">
                                    ({product.reviewCount} {dict.product_detail.customerReviews})
                                </span>
                            )}
                        </div>
                    )}

                    {/* Configuration */}
                    <div className="space-y-10 mb-12">
                        {/* Scale Selection */}
                        <div>
                            <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400 mb-6">{dict.product_detail.selectScale}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {scales.map((scale) => (
                                    <button
                                        key={scale}
                                        onClick={() => handleScaleChange(scale)}
                                        className={`p-4 border rounded-sm transition-all text-left ${selectedScale === scale
                                            ? "border-brand-yellow bg-brand-yellow/5"
                                            : "border-white/5 bg-white/[0.02] hover:border-white/20"
                                            }`}
                                    >
                                        <div className={`text-xs font-black uppercase tracking-widest ${selectedScale === scale ? "text-brand-yellow" : "text-white"}`}>
                                            {scale}
                                        </div>
                                        <div className="text-[10px] font-bold text-neutral-400 uppercase mt-1">
                                            ~{SCALE_CONFIG[scale].size}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Finish Selection */}
                        <div>
                            <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400 mb-6">{dict.product_detail.selectFinish}</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {finishes.map((finish) => (
                                    <button
                                        key={finish}
                                        onClick={() => handleFinishChange(finish)}
                                        className={`p-4 border rounded-sm transition-all text-left ${selectedFinish === finish
                                            ? "border-brand-yellow bg-brand-yellow/5"
                                            : "border-white/5 bg-white/[0.02] hover:border-white/20"
                                            }`}
                                    >
                                        <div className={`text-xs font-black uppercase tracking-widest ${selectedFinish === finish ? "text-brand-yellow" : "text-white"}`}>
                                            {finish === "painted" ? dict.product_detail.handPainted : dict.product_detail.rawKit}
                                        </div>
                                        <div className="text-[10px] font-bold text-neutral-400 uppercase mt-1">
                                            {finish === "painted" ? dict.product_detail.museumGrade : dict.product_detail.primed}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400 mb-4">{dict.product_detail.description}</h2>
                        <p className="text-neutral-400 font-medium leading-[1.8] text-base whitespace-pre-wrap">
                            {
                                (lang === 'en' ? product.description_en :
                                 lang === 'it' ? product.description_it :
                                 lang === 'de' ? product.description_de :
                                 lang === 'fr' ? product.description_fr :
                                 lang === 'es' ? product.description_es : 
                                 product.description) || product.description
                            }
                        </p>
                    </div>

                    {/* Details list */}
                    <div className="mb-12">
                        <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400 mb-6">{dict.product_detail.specifications}</h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            {(dict.product_detail.features || STANDARD_FEATURES).map((detail: string) => (
                                <li key={detail} className="flex items-start gap-3 text-xs uppercase font-bold tracking-wider text-white">
                                    <CheckCircle className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                                    {detail}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action */}
                    <div className="mt-auto space-y-8">
                        <div className="max-w-md mx-auto">
                            <AddToCartButton
                                product={product}
                                selectedScale={selectedScale}
                                selectedFinish={selectedFinish}
                                currentPrice={currentPrice}
                                lang={lang}
                                dict={dict}
                            />
                        </div>

                        {/* Minor trust badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10 border-t border-white/5">
                            <div className="flex items-start gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                <ShieldCheck className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                <span>{dict.product_detail.encryptedCheckout}</span>
                            </div>
                            <div className="flex items-start gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                <Truck className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                <span>{dict.product_detail.insuredShipping}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Full trust badge grid below the main layout */}
            <TrustBadges dict={dict} className="mt-20 pt-16 border-t border-white/5" />

        </div>
    );
}
