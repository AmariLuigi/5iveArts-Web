"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { createClient } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/products";
import {
    ChevronLeft,
    Package,
    Truck,
    MapPin,
    Mail,
    Calendar,
    Tag as TagIcon,
    CreditCard,
    ExternalLink,
    ChevronRight,
    Clipboard,
    CheckCircle2,
    Loader2,
    Users,
    Sparkles,
    Image as ImageIcon,
    Plus,
    Copy,
    Check,
    History,
    Box
} from "lucide-react";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";

interface OrderDetailClientProps {
    order: any;
    orderItems: any[];
    initialProgressMedia: any[];
}

export default function OrderDetailClient({ order, orderItems, initialProgressMedia }: OrderDetailClientProps) {
    const router = useRouter();
    const [status, setStatus] = useState(order.status);
    const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
    const [progressMedia, setProgressMedia] = useState(initialProgressMedia);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    
    // Custom Quote State - base_price_pence is the absolute baseline (85.00)
    // subtotal_pence is the resulting adjusted subtotal (102.00)
    const [basePrice, setBasePrice] = useState(order.base_price_pence || order.subtotal_pence || order.total_pence || 0);
    const [complexity, setComplexity] = useState(order.complexity_factor || 1.0);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [lastCopied, setLastCopied] = useState<string | null>(null);
    const [trackingData, setTrackingData] = useState<any>(null);
    const [loadingTracking, setLoadingTracking] = useState(false);

    const supabase = createClient();

    useState(() => {
        if (order.tracking_number && (status === 'shipped' || status === 'delivered')) {
            const fetchTracking = async () => {
                setLoadingTracking(true);
                try {
                    const res = await axios.get(`/api/orders/${order.id}/tracking`);
                    setTrackingData(res.data);
                } catch (err) {
                    console.error("Tracking fetch failed:", err);
                } finally {
                    setLoadingTracking(false);
                }
            };
            fetchTracking();
        }
    });

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setLastCopied(type);
            setTimeout(() => setLastCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleStageTransition = async (nextStatus: string, additionalData: any = {}) => {
        setLoading(true);
        setMessage(null);
        try {
            await axios.patch(`/api/admin/orders/${order.id}`, {
                status: nextStatus,
                ...additionalData
            });
            setStatus(nextStatus);
            setMessage({ type: "success", text: `Protocol Shift: ${nextStatus.toUpperCase()}` });
            router.refresh();
        } catch (err: any) {
            setMessage({ type: "error", text: `Transition failed: ${err.response?.data?.error || err.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const adjustedSubtotal = Math.round(basePrice * complexity);
            await axios.patch(`/api/admin/orders/${order.id}`, {
                status,
                tracking_number: trackingNumber || null,
                base_price_pence: basePrice,
                complexity_factor: complexity,
                subtotal_pence: adjustedSubtotal,
                total_pence: order.is_custom ? (adjustedSubtotal + (order.shipping_pence || 0)) : order.total_pence
            });
            setMessage({ type: "success", text: "Order state stabilized" });
            router.refresh();
        } catch (err: any) {
            console.error("[handleUpdate] Error:", err);
            setMessage({ type: "error", text: `Update failed: ${err.response?.data?.error || err.message}` });
        }
        setLoading(false);
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case "paid": return "text-blue-400 border-blue-400/20 bg-blue-400/5";
            case "processing": return "text-orange-400 border-orange-400/20 bg-orange-400/5";
            case "analyzing": return "text-orange-400 border-orange-400/20 bg-orange-400/5";
            case "quoted": return "text-orange-400 border-orange-400/20 bg-orange-400/5";
            case "in_production": return "text-brand-yellow border-brand-yellow/20 bg-brand-yellow/5";
            case "ready_to_ship": return "text-brand-yellow border-brand-yellow/20 bg-brand-yellow/5";
            case "shipped": return "text-purple-400 border-purple-400/20 bg-purple-400/5";
            case "delivered": return "text-green-400 border-green-400/20 bg-green-400/5";
            case "cancelled": return "text-red-400 border-red-400/20 bg-red-400/5";
            default: return "text-neutral-400 border-neutral-400/20 bg-neutral-400/5";
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col gap-6 pb-10 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Link href="/admin/orders" className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-brand-yellow transition-colors flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3" />
                        Back to Orders
                    </Link>
                    <ChevronRight className="w-3 h-3 text-neutral-900" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-yellow">Order Details</span>
                    {order.is_custom && (
                        <>
                           <ChevronRight className="w-3 h-3 text-neutral-900" />
                           <span className="bg-brand-yellow/10 text-brand-yellow px-2 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest border border-brand-yellow/20">Artisan Commission</span>
                        </>
                    )}
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                            </h1>
                            <span className={`px-3 py-1 rounded-[2px] border text-[10px] font-black uppercase tracking-[0.2em] ${getStatusColor(status)}`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-neutral-600">
                            Placed on {new Date(order.created_at).toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                    </div>

                    {order.stripe_session_id && (
                        <a
                            href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all rounded-sm"
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            View in Stripe <ExternalLink className="w-3 h-3 text-neutral-600" />
                        </a>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-10">
                    
                    {/* Phase segmented management */}
                    {order.is_custom && (
                        <div className="space-y-10">
                            {/* Phase 1: Analysis Protocol */}
                            {(status === 'analyzing' || status === 'quoted') && (
                                <div className="hasbro-card p-10 border-orange-500/20 bg-orange-500/[0.02] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Sparkles className="w-40 h-40 text-orange-500" />
                                    </div>
                                    <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-orange-400 mb-10 flex items-center gap-3">
                                        <Sparkles className="w-5 h-5" />
                                        Phase 01: Analysis Protocol
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Baseline Artifact Value</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={basePrice}
                                                        onChange={(e) => setBasePrice(Number(e.target.value))}
                                                        className="w-full bg-black border border-white/10 rounded-sm p-4 text-xs font-black uppercase text-white focus:border-orange-500/30"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-black text-[10px]">{formatPrice(basePrice)}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Complexity Factor</label>
                                                <div className="flex gap-4">
                                                    <input 
                                                        type="number" step="0.05" value={complexity}
                                                        onChange={(e) => setComplexity(Number(e.target.value))}
                                                        className="flex-1 bg-black border border-white/10 rounded-sm p-4 text-xs font-black uppercase text-white"
                                                    />
                                                    <button 
                                                        onClick={async () => {
                                                            setLoading(true);
                                                            try {
                                                                const res = await axios.post("/api/admin/ai/analyze-complexity", {
                                                                    imageUrl: progressMedia[0]?.url || "",
                                                                    finishType: orderItems[0]?.selectedFinish?.toUpperCase() || "PAINTED"
                                                                });
                                                                if (res.data.complexity_factor) setComplexity(Number(res.data.complexity_factor.toFixed(2)));
                                                            } finally { setLoading(false); }
                                                        }}
                                                        disabled={loading}
                                                        className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-sm hover:bg-orange-500/20 transition-all text-orange-400"
                                                    >
                                                        <Sparkles className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                              <div className="p-6 bg-black/40 border border-white/5 rounded-sm space-y-4">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Calculated Prototype Quote</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter">{formatPrice(Math.round(basePrice * complexity))}</p>
                                                <p className="text-[8px] font-bold text-neutral-700 uppercase tracking-[0.2em]">+ {formatPrice(order.shipping_pence || 0)} Logistics Contribution</p>
                                              </div>
                                              
                                              <button 
                                                onClick={async () => {
                                                    if (basePrice < 100) return;
                                                    setIsGeneratingLink(true);
                                                    try {
                                                        const adjusted = Math.round(basePrice * complexity);
                                                        await axios.patch(`/api/admin/orders/${order.id}`, {
                                                            total_pence: adjusted + (order.shipping_pence || 0),
                                                            subtotal_pence: adjusted,
                                                            base_price_pence: basePrice,
                                                            complexity_factor: complexity,
                                                            status: 'quoted'
                                                        });
                                                        const res = await axios.post(`/api/admin/orders/${order.id}/payment-link`, { type: 'deposit' });
                                                        copyToClipboard(res.data.url, 'deposit');
                                                        router.refresh();
                                                    } finally { setIsGeneratingLink(false); }
                                                }}
                                                disabled={isGeneratingLink}
                                                className="w-full hasbro-btn-primary py-5 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(234,179,8,0.2)]"
                                              >
                                                <CreditCard className="w-4 h-4" />
                                                {lastCopied === 'deposit' ? "Link Copied to Bureau" : "Request 50% Protocol Deposit"}
                                              </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phase 2: Forging Protocol */}
                            {status === 'in_production' && (
                                <div className="hasbro-card p-10 border-brand-yellow/20 bg-brand-yellow/[0.02] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <History className="w-40 h-40 text-brand-yellow" />
                                    </div>
                                    <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 flex items-center gap-3">
                                        <Box className="w-5 h-5" />
                                        Phase 02: Forging Protocol
                                    </h3>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-10">Production is active. Capture visual artifacts to update the collectors journal.</p>
                                    
                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={() => handleStageTransition('ready_to_ship')}
                                            disabled={loading}
                                            className="px-10 py-5 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all rounded-sm flex items-center gap-3"
                                        >
                                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Complete Production Phase
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Phase 3: Finalization Protocol */}
                            {status === 'ready_to_ship' && (
                                <div className="hasbro-card p-10 border-brand-yellow/30 bg-brand-yellow/[0.05] relative overflow-hidden">
                                     <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Phase 03: Finalization
                                    </h3>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-10 italic">Artifact materialized. Secure the final balance before deployment initiation.</p>
                                    
                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={async () => {
                                                setIsGeneratingLink(true);
                                                try {
                                                    const res = await axios.post(`/api/admin/orders/${order.id}/payment-link`, { type: 'final' });
                                                    copyToClipboard(res.data.url, 'final');
                                                } finally { setIsGeneratingLink(false); }
                                            }}
                                            disabled={isGeneratingLink}
                                            className="px-10 py-5 bg-brand-yellow text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all rounded-sm flex items-center gap-3 shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            {lastCopied === 'final' ? "Residue Link Copied" : "Request Final Balance"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Phase 4: Deployment Protocol */}
                            {status === 'paid' && (
                                <div className="hasbro-card p-10 border-purple-500/20 bg-purple-500/[0.02] relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Truck className="w-40 h-40 text-purple-500" />
                                    </div>
                                    <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-purple-400 mb-8 flex items-center gap-3">
                                        <Truck className="w-5 h-5" />
                                        Phase 04: Deployment
                                    </h3>
                                    
                                    <div className="space-y-8 max-w-md">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Carrier Tracking Identification</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={trackingNumber}
                                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                                    placeholder="Enter Tracking ID..."
                                                    className="flex-1 bg-black border border-white/10 rounded-sm p-4 text-xs font-black uppercase text-white focus:border-purple-500/30"
                                                />
                                                <button 
                                                    onClick={() => handleStageTransition('shipped', { tracking_number: trackingNumber })}
                                                    disabled={!trackingNumber || loading}
                                                    className="px-8 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all rounded-sm disabled:opacity-30"
                                                >
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Artifact"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Live Tracking Intelligence */}
                    {(status === 'shipped' || status === 'delivered') && trackingData && (
                        <div className="hasbro-card p-10 border-blue-500/20 bg-blue-500/[0.02] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Truck className="w-40 h-40 text-blue-500" />
                            </div>
                            <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-blue-400 mb-8 flex items-center gap-3">
                                <Truck className="w-5 h-5" />
                                In-Transit Intelligence
                            </h3>

                            <div className="space-y-4 max-w-2xl">
                                <div className="flex flex-wrap gap-8 items-center py-4 border-y border-white/5 mb-8">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest mb-1">Carrier Network</p>
                                        <p className="text-[10px] font-black text-white uppercase">{trackingData.carrier}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest mb-1">Last Transmission</p>
                                        <p className="text-[10px] font-black text-brand-yellow uppercase">{new Date(trackingData.lastUpdated).toLocaleString()}</p>
                                    </div>
                                    {order.carrier_delivered && (
                                            <div className="ml-auto px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                                            <p className="text-[8px] font-black uppercase text-green-500 tracking-widest animate-pulse">Carrier Reports Delivered</p>
                                            </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {trackingData.movements.slice(0, 5).map((move: any, idx: number) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-brand-yellow' : 'bg-neutral-800'}`} />
                                                {idx !== Math.min(trackingData.movements.length, 5) - 1 && <div className="w-px h-full bg-white/5" />}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none mb-1">{move.description}</p>
                                                <p className="text-[8px] text-neutral-600 uppercase font-black tracking-widest">{move.location} — {new Date(move.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {!order.is_custom && (
                         <div className="hasbro-card p-8">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white mb-8 flex items-center gap-2">
                                <TagIcon className="w-4 h-4 text-brand-yellow" />
                                Quick Management
                            </h3>

                            <form onSubmit={handleUpdate} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Fulfillment Status</label>
                                        <CustomSelect
                                            value={status}
                                            onChange={(val: string) => setStatus(val)}
                                            options={[
                                                { code: "paid", name: "Paid" },
                                                { code: "processing", name: "Processing" },
                                                { code: "shipped", name: "Shipped" },
                                                { code: "delivered", name: "Delivered" },
                                                { code: "cancelled", name: "Cancelled" },
                                                { code: "refunded", name: "Refunded" }
                                            ]}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Tracking Number</label>
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Enter tracking ID..."
                                            className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black uppercase tracking-widest text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/30"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    {message && (
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                            {message.text}
                                        </p>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="hasbro-btn-primary px-10 py-4 font-black text-[10px] uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Update Order Logistics
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                        {/* Universal Logistics Protocol Selector */}
                        <div className="hasbro-card p-8 border-white/5 bg-white/[0.01] space-y-8">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-2 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-brand-yellow" />
                                Logistics Selection Protocol
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(order.shipping_options || []).map((opt: any) => (
                                    <button
                                        key={opt.service_id}
                                        type="button"
                                        onClick={async () => {
                                            const shippingPence = Math.round(opt.price);
                                            setMessage(null);
                                            setLoading(true);
                                            try {
                                                const artifactTotal = order.subtotal_pence || Math.round(basePrice * complexity);
                                                await axios.patch(`/api/admin/orders/${order.id}`, {
                                                    shipping_pence: shippingPence,
                                                    packlink_service_id: opt.service_id,
                                                    shipping_service_name: `${opt.carrier_name} — ${opt.service_name}`,
                                                    total_pence: artifactTotal + shippingPence
                                                });
                                                setMessage({ type: 'success', text: `Logistics sync: ${opt.service_name} selected` });
                                                router.refresh();
                                            } catch (err: any) {
                                                setMessage({ type: 'error', text: 'Logistics sync failed' });
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className={`p-4 border text-left transition-all rounded-sm flex flex-col gap-1 ${
                                            (order.packlink_service_id || order.shipping_service_id) === opt.service_id 
                                            ? "bg-brand-yellow/10 border-brand-yellow/50" 
                                            : "bg-black/40 border-white/5 hover:border-white/20"
                                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-white">{opt.carrier_name}</span>
                                            <span className="text-[10px] font-black text-brand-yellow font-mono">{formatPrice(opt.price)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="text-[8px] font-bold uppercase text-neutral-500">{opt.service_name}</span>
                                            <span className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">{opt.estimated_days} Days Est.</span>
                                        </div>
                                    </button>
                                ))}
                                {(!order.shipping_options || order.shipping_options.length === 0) && (
                                    <div className="col-span-full p-8 border border-dashed border-white/5 text-center">
                                        <p className="text-[10px] uppercase font-black text-neutral-600 italic">No logistical snapshots available for this deployment</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 flex items-center gap-2">
                            <Package className="w-4 h-4 text-brand-yellow" />
                            Arsenal Contents
                        </h3>
                        <div className="hasbro-card overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600">Product</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600 text-center">Qty</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600 text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {orderItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase text-white tracking-widest">{item.product_name}</span>
                                                    <span className="text-[9px] font-black uppercase text-neutral-600 tracking-widest mt-1">ID: {item.product_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center text-xs font-black text-white">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-5 text-right text-xs font-black text-white">
                                                {formatPrice(item.product_price_pence)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-white/[0.02]">
                                    <tr className="border-t border-white/5">
                                        <td colSpan={2} className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600">Subtotal (Adjusted)</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-white">{formatPrice(order.subtotal_pence)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="px-6 py-4 text-[10px] uppercase font_black tracking_widest text-neutral-600 border-t border-white/[0.02]">Logistics Tier</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-white border-t border-white/[0.02]">{formatPrice(order.shipping_pence)}</td>
                                    </tr>
                                    {order.is_custom && (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600 border-t border-white/[0.02]">Initial Deposit Paid</td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-neutral-400 border-t border-white/[0.02]">-{formatPrice(order.deposit_pence || 0)}</td>
                                        </tr>
                                    )}
                                    <tr className="border-t border-brand-yellow/10">
                                        <td colSpan={2} className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-brand-yellow">
                                            {order.is_custom && order.status === 'ready_to_ship' ? "Balance Due" : "Grand Total"}
                                        </td>
                                        <td className="px-6 py-5 text-right text-xl font-black text-brand-yellow tracking-tighter">
                                            {formatPrice(order.is_custom && (status === 'ready_to_ship' || status === 'delivered') ? (order.total_pence - (order.deposit_pence || 0)) : order.total_pence)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Order Journey (Progress Photos) */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-brand-yellow" />
                                Fabrication Journey
                            </h3>
                            <label className="cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-sm text-[8px] font-black uppercase tracking-widest text-brand-yellow hover:bg-brand-yellow/10 transition-all flex items-center gap-2">
                                <Plus className="w-3 h-3" />
                                {isUploading ? "Stabilizing..." : "Add Record"}
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    disabled={isUploading}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        
                                        setIsUploading(true);
                                        setMessage(null);
                                        try {
                                            const fileExt = file.name.split('.').pop();
                                            const fileName = `${order.id}/${Date.now()}.${fileExt}`;
                                            const { error: uploadError } = await supabase.storage
                                                .from('order-progress')
                                                .upload(fileName, file);
                                            
                                            if (uploadError) throw uploadError;
                                            
                                            const { data: { publicUrl } } = supabase.storage
                                                .from('order-progress')
                                                .getPublicUrl(fileName);
                                            
                                            const res = await axios.post(`/api/admin/orders/${order.id}/progress`, {
                                                url: publicUrl,
                                                stage: status === "in_production" ? "Painting" : "Printing"
                                            });
                                            
                                            const { data: newMedia } = await axios.get(`/api/admin/orders/${order.id}/progress`);
                                            
                                            setProgressMedia(newMedia || []);
                                            setMessage({ type: 'success', text: "Progress record stabilized" });
                                        } catch (err: any) {
                                            console.error(err);
                                            setMessage({ type: 'error', text: `Record failed: ${err.message}` });
                                        } finally {
                                            setIsUploading(false);
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {progressMedia.map((m) => (
                                <div key={m.id} className="hasbro-card aspect-square relative group overflow-hidden">
                                    <img src={m.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={m.stage} />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-yellow mb-1">{m.stage}</span>
                                        <span className="text-[7px] text-white/40">{new Date(m.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {progressMedia.length === 0 && (
                                <div className="col-span-full py-12 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-neutral-700">
                                    <ImageIcon className="w-8 h-8 mb-3 opacity-20" />
                                    <span className="text-[10px] uppercase font-black tracking-widest">No visual records captured yet</span>
                                </div>
                            )}
                        </div>
                    </div>

                {/* Right Col: Customer Info */}
                <div className="space-y-8">
                    <div className="hasbro-card p-8 space-y-8">
                        <div>
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4 text-brand-yellow" />
                                Customer Profile
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-yellow/10 flex items-center justify-center text-[10px] font-black text-brand-yellow border border-brand-yellow/20">
                                        {order.customer_name?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-xs font-black uppercase text-white tracking-widest">{order.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-neutral-500 hover:text-white transition-colors">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold tracking_widest lowercase">{order.customer_email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-6 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-brand-yellow" />
                                Shipping Address
                            </h3>
                            <div className="space-y-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 leading-relaxed">
                                <p className="text-white font-black">{order.shipping_address?.full_name}</p>
                                <p>{order.shipping_address?.street1}</p>
                                {order.shipping_address?.street2 && <p>{order.shipping_address?.street2}</p>}
                                <p>{order.shipping_address?.city}, {order.shipping_address?.zip_code}</p>
                                <p>{order.shipping_address?.country}</p>
                                {order.shipping_address?.phone && (
                                    <p className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                        <span className="text-[9px] font-black text-neutral-600">PHONE:</span> {order.shipping_address.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-6 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-brand-yellow" />
                                Logistics Protocol
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] font-black text-white tracking-widest">
                                <div className="bg-white/5 px-3 py-2 border border-white/5 flex items-center gap-2 w-full uppercase">
                                    {order.shipping_service_name || order.packlink_service_id || order.shipping_service_id || "Standard Carrier"}
                                    {order.tracking_number && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-yellow ml-auto" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
