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
    Check
} from "lucide-react";
import Link from "next/link";

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
    
    // Custom Quote State
    const [totalPrice, setTotalPrice] = useState(order.total_pence || 0);
    const [complexity, setComplexity] = useState(order.complexity_factor || 1.0);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [lastCopied, setLastCopied] = useState<string | null>(null);

    const supabase = createClient();

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setLastCopied(type);
            setTimeout(() => setLastCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await axios.patch(`/api/admin/orders/${order.id}`, {
                status,
                tracking_number: trackingNumber || null,
                total_pence: totalPrice,
                complexity_factor: complexity
            });
            setMessage({ type: "success", text: "Order updated successfully" });
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
                {/* Left Col: Order Info */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Status Update Form */}
                    <div className="hasbro-card p-8">
                        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white mb-8 flex items-center gap-2">
                            <TagIcon className="w-4 h-4 text-brand-yellow" />
                            Quick Management
                        </h3>

                        <form onSubmit={handleUpdate} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Fulfillment Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/30"
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                        {/* Custom Workflow Statuses */}
                                        <option value="analyzing">Analyzing (Custom)</option>
                                        <option value="quoted">Quoted (Custom)</option>
                                        <option value="deposit_paid">Deposit Paid (Custom)</option>
                                        <option value="in_production">In Production (Custom)</option>
                                        <option value="ready_to_ship">Ready to Ship (Custom)</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Tracking Number</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Enter tracking ID..."
                                            className="flex-1 bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black tracking-widest text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/30"
                                        />
                                        {order.is_custom && status === "analyzing" && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        const res = await axios.post("/api/admin/ai/analyze-complexity", {
                                                            imageUrl: progressMedia[0]?.url || "",
                                                            finishType: orderItems[0]?.selectedFinish?.toUpperCase() || "PAINTED"
                                                        });
                                                        if (res.data.complexity_factor) {
                                                            setComplexity(Number(res.data.complexity_factor.toFixed(2)));
                                                            setMessage({ type: 'success', text: `AI Quoted: ${res.data.complexity_factor.toFixed(2)}x factor` });
                                                        }
                                                    } catch (err) {
                                                        setMessage({ type: 'error', text: 'AI Quote Failed' });
                                                    }
                                                }}
                                                className="p-4 bg-brand-yellow/10 border border-brand-yellow/20 rounded-sm hover:bg-brand-yellow/20 transition-all group"
                                                title="AI Quote Analysis"
                                            >
                                                <Sparkles className="w-4 h-4 text-brand-yellow group-hover:scale-110 transition-all" />
                                            </button>
                                        )}
                                    </div>
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
                                    Update Order State
                                </button>
                            </div>
                        </form>
                    </div>

                    {order.is_custom && (
                        <div className="hasbro-card p-8 border-brand-yellow/10 bg-brand-yellow/[0.01]">
                            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-yellow mb-8 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Artisan Bureau Control
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Commission Total (Pence)</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={totalPrice}
                                            onChange={(e) => setTotalPrice(Number(e.target.value))}
                                            className="w-full bg-black border border-white/10 rounded-sm p-4 text-xs font-black uppercase text-white focus:border-brand-yellow/30"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-black text-[10px]">
                                            {formatPrice(totalPrice)}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Project Protocol (Scale)</label>
                                    <div className="bg-black/40 border border-white/5 p-4 rounded-sm text-xs font-black uppercase text-brand-yellow tracking-widest">
                                        {order.scale || "Standard (1:12)"}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Complexity Factor</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        value={complexity}
                                        onChange={(e) => setComplexity(Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 rounded-sm p-4 text-xs font-black uppercase text-white focus:border-brand-yellow/30"
                                    />
                                </div>
                            </div>

                            {/* Shipping Option Selector */}
                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Select Logistics Protocol (Packlink)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(order.shipping_options || []).map((opt: any) => (
                                        <button
                                            key={opt.service_id}
                                            onClick={() => {
                                                const shippingPence = Math.round(opt.price * 100);
                                                axios.patch(`/api/admin/orders/${order.id}`, {
                                                    shipping_pence: shippingPence,
                                                    shipping_service_id: opt.service_id,
                                                    shipping_service_name: `${opt.carrier_name} — ${opt.service_name}`
                                                }).then(() => {
                                                    setMessage({ type: 'success', text: `Logistics sync: ${opt.service_name} selected` });
                                                    router.refresh();
                                                });
                                            }}
                                            className={`p-4 border text-left transition-all rounded-sm flex flex-col gap-1 ${
                                                order.shipping_service_id === opt.service_id 
                                                ? "bg-brand-yellow/10 border-brand-yellow/50" 
                                                : "bg-black/40 border-white/5 hover:border-white/20"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-white">{opt.carrier_name}</span>
                                                <span className="text-[10px] font-black text-brand-yellow">{formatPrice(opt.price * 100)}</span>
                                            </div>
                                            <span className="text-[8px] font-bold uppercase text-neutral-500">{opt.service_name}</span>
                                        </button>
                                    ))}
                                    {(!order.shipping_options || order.shipping_options.length === 0) && (
                                        <div className="col-span-full p-8 border border-dashed border-white/5 text-center">
                                            <p className="text-[10px] uppercase font-black text-neutral-600">No logistics profiles generated on entry</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                                <button 
                                    onClick={async () => {
                                        const artifactTotal = Math.round(totalPrice * complexity);
                                        const shippingPence = order.shipping_pence || 0;
                                        const grandTotal = artifactTotal + shippingPence;
                                        
                                        setLoading(true);
                                        try {
                                            await axios.patch(`/api/admin/orders/${order.id}`, {
                                                total_pence: grandTotal,
                                                subtotal_pence: artifactTotal,
                                                complexity_factor: complexity,
                                                status: status,
                                                shipping_pence: shippingPence
                                            });
                                            setTotalPrice(artifactTotal);
                                            setMessage({ type: 'success', text: `Grand Protocol Sync: ${formatPrice(grandTotal)} (Inc. Shipping)` });
                                            router.refresh();
                                        } catch (err: any) {
                                            setMessage({ type: 'error', text: 'Pricing sync failed' });
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-[10px] font-black uppercase tracking-widest text-white transition-all rounded-sm flex items-center gap-2"
                                >
                                    Sync Grand Protocol ({formatPrice(Math.round(totalPrice * complexity) + (order.shipping_pence || 0))})
                                </button>
                                
                                <button 
                                    onClick={async () => {
                                        if (totalPrice < 100) { // Enforce 1 EUR minimum for safety
                                            setMessage({ type: 'error', text: 'Set a total price (min 100 pence) before generating a link' });
                                            return;
                                        }
                                        
                                        setIsGeneratingLink(true);
                                        try {
                                          // Proactively save if the admin adjusted the price
                                          if (totalPrice !== order.total_pence || complexity !== order.complexity_factor) {
                                              await axios.patch(`/api/admin/orders/${order.id}`, {
                                                  total_pence: totalPrice,
                                                  complexity_factor: complexity,
                                                  status: status
                                              });
                                          }

                                          const res = await axios.post(`/api/admin/orders/${order.id}/payment-link`, { type: 'deposit' });
                                          const url = res.data.url;
                                          copyToClipboard(url, 'deposit');
                                          setMessage({ type: 'success', text: 'Payment Link Generated & Collector Vault Updated' });
                                          router.refresh();
                                        } catch (err: any) {
                                          setMessage({ type: 'error', text: `Failed to generate link: ${err.response?.data?.error || err.message}` });
                                        } finally {
                                          setIsGeneratingLink(false);
                                        }
                                    }}
                                    disabled={isGeneratingLink || (status !== 'analyzing' && status !== 'quoted')}
                                    className="px-6 py-4 bg-brand-yellow text-black text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow/80 hover:scale-105 transition-all rounded-sm disabled:opacity-30 flex items-center gap-2"
                                >
                                    {lastCopied === 'deposit' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    Request 50% Deposit
                                </button>

                                <button 
                                    onClick={async () => {
                                      setIsGeneratingLink(true);
                                      try {
                                        const res = await axios.post(`/api/admin/orders/${order.id}/payment-link`, { type: 'final' });
                                        const url = res.data.url;
                                        copyToClipboard(url, 'final');
                                        setMessage({ type: 'success', text: 'Final Balance Link Generated & Vault Updated' });
                                        router.refresh();
                                      } catch (err) {
                                        setMessage({ type: 'error', text: 'Failed to generate link' });
                                      } finally {
                                        setIsGeneratingLink(false);
                                      }
                                    }}
                                    disabled={isGeneratingLink || status !== 'ready_to_ship'}
                                    className="px-6 py-4 bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all rounded-sm disabled:opacity-30 flex items-center gap-2"
                                >
                                    {lastCopied === 'final' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    Request Final Balance
                                </button>
                            </div>
                        </div>
                    )}

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
                                        <td colSpan={2} className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600">Subtotal</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-white">{formatPrice(order.subtotal_pence)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600 border-t border-white/[0.02]">Shipping</td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-white border-t border-white/[0.02]">{formatPrice(order.shipping_pence)}</td>
                                    </tr>
                                    <tr className="border-t border-brand-yellow/10">
                                        <td colSpan={2} className="px-6 py-5 text-[10px] uppercase font-black tracking-widest text-brand-yellow">Grand Total</td>
                                        <td className="px-6 py-5 text-right text-xl font-black text-brand-yellow tracking-tighter">{formatPrice(order.total_pence)}</td>
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
                                            
                                            // Create the record via the admin API
                                            const res = await axios.post(`/api/admin/orders/${order.id}/progress`, {
                                                url: publicUrl,
                                                stage: status === "in_production" ? "Painting" : "Printing"
                                            });
                                            
                                            // Fetch the updated list
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
                                    <span className="text-[10px] font-bold tracking-widest lowercase">{order.customer_email}</span>
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
                                    {order.shipping_service_name || order.shipping_service_id || "Standard Carrier"}
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
