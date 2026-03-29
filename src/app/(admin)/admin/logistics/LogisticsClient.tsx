"use client";

import { useState, useEffect } from "react";
import { 
    CreditCard, 
    AlertTriangle, 
    Truck, 
    Download, 
    Loader2, 
    Check, 
    ExternalLink,
    Package,
    Navigation,
    Mail
} from "lucide-react";
import axios from "axios";
import { formatPrice } from "@/lib/products";
import { motion, AnimatePresence } from "framer-motion";

interface LogisticsClientProps {
    initialOrders: any[];
}

export default function LogisticsClient({ initialOrders }: LogisticsClientProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [credit, setCredit] = useState<{ value: number, currency: string } | null>(null);
    const [loadingCredit, setLoadingCredit] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchCredit();
    }, []);

    const fetchCredit = async () => {
        try {
            setLoadingCredit(true);
            const res = await axios.get("/api/admin/logistics/credit");
            setCredit(res.data);
        } catch (err) {
            console.error("Failed to fetch credit:", err);
        } finally {
            setLoadingCredit(false);
        }
    };

    const handleCreateShipment = async (orderId: string) => {
        try {
            setProcessing(orderId);
            const res = await axios.post("/api/admin/logistics/ship", { orderId });
            
            if (res.data.success) {
                setResults(prev => ({ 
                    ...prev, 
                    [orderId]: { 
                        success: true, 
                        tracking: res.data.trackingNumber,
                        label: res.data.labelBase64
                    } 
                }));
                // Real-time update in UI
                setOrders(prev => prev.filter(o => o.id !== orderId));
                fetchCredit(); // Update balance
            }
        } catch (err: any) {
            console.error("Shipment failed:", err);
            setResults(prev => ({ 
                ...prev, 
                [orderId]: { 
                    success: false, 
                    error: err.response?.data?.error || "Automated Fulfillment Failed" 
                } 
            }));
        } finally {
            setProcessing(null);
        }
    };

    const downloadLabel = (base64: string, filename: string) => {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${base64}`;
        link.download = filename;
        link.click();
    };

    const isLowCredit = credit && credit.value < 20;

    return (
        <div className="space-y-10 pb-20">
            {/* Account Insight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="hasbro-card p-6 border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="w-4 h-4 text-brand-yellow" />
                        <h3 className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Paccofacile Credit</h3>
                    </div>
                    {loadingCredit ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">{credit?.value.toFixed(2)}</span>
                            <span className="text-xs font-bold text-neutral-600 uppercase tracking-widest">{credit?.currency}</span>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {isLowCredit && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="md:col-span-2 hasbro-card p-6 border-red-500/30 bg-red-500/5 flex items-center gap-6"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-red-500 mb-1">Low Account Balance Alert</h4>
                                <p className="text-[11px] font-bold text-red-400/70 uppercase tracking-widest leading-relaxed">
                                    Your Paccofacile credit is below €20. Automated fulfillment will fail if credit is exhausted. Top up your account immediately.
                                </p>
                            </div>
                            <div className="ml-auto">
                                <a 
                                    href="https://www.paccofacile.it/ricarica/wallet" 
                                    target="_blank" 
                                    className="px-6 py-2.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all hover:bg-red-600 inline-flex items-center gap-2"
                                >
                                    Refill Now <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pending Shipments Header */}
            <div className="pt-10 border-t border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-2">Awaiting Deployment</h2>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                        Orders recorded in the vault and paid, but not yet hand-off to logsitics.
                    </p>
                </div>
                <div className="bg-brand-yellow/10 border border-brand-yellow/20 px-4 py-2 rounded">
                   <span className="text-[10px] font-black text-brand-yellow tracking-widest uppercase">{orders.length} Ready Orders</span>
                </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="py-20 text-center hasbro-card bg-neutral-900/10 border-dashed border-white/5">
                        <Check className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-600 italic">No orders currently staged for shipment.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="hasbro-card bg-[#050505] p-6 border-white/5 hover:border-white/10 transition-colors group">
                           <div className="flex flex-col md:flex-row md:items-center gap-8">
                                {/* Order Metadata */}
                                <div className="w-48 shrink-0">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1 truncate">{order.customer_name}</h4>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${order.is_custom ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>
                                           {order.is_custom ? "COMMISSION" : "ARCHIVE"}
                                        </span>
                                        <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">ID: {order.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>

                                {/* Destination */}
                                <div className="flex-1 border-l border-white/5 pl-8 hidden lg:block">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Navigation className="w-3 h-3 text-brand-yellow rotate-45" />
                                        <span className="text-[9px] uppercase font-black tracking-widest text-neutral-500">Target Destination</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
                                        {order.shipping_address.street1}, {order.shipping_address.city} ({order.shipping_address.zip_code})<br />
                                        {order.shipping_address.country}
                                    </p>
                                </div>

                                {/* Logistics Details */}
                                <div className="w-56 border-l border-white/5 pl-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Truck className="w-3 h-3 text-brand-yellow" />
                                        <span className="text-[9px] uppercase font-black tracking-widest text-neutral-500">Selected Logistics</span>
                                    </div>
                                    <p className="text-[9px] font-black text-white uppercase tracking-widest truncate">{order.shipping_service_name}</p>
                                    <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Value: {formatPrice(order.total_pence || 0)}</p>
                                </div>

                                {/* Actions */}
                                <div className="shrink-0 flex items-center gap-3">
                                    <AnimatePresence mode="wait">
                                        {results[order.id]?.success ? (
                                            <motion.div 
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="px-4 py-2 border border-green-500/20 bg-green-500/5 text-green-500 flex items-center gap-2 rounded">
                                                    <Check className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Fulfillment Active</span>
                                                </div>
                                                <button 
                                                    onClick={() => downloadLabel(results[order.id].label, `label-${order.id.slice(0,8)}.pdf`)}
                                                    className="p-2 border border-white/10 rounded hover:bg-white/5 transition-all group"
                                                >
                                                    <Download className="w-4 h-4 text-white group-hover:text-brand-yellow" />
                                                </button>
                                            </motion.div>
                                        ) : results[order.id]?.error ? (
                                            <div className="flex items-center gap-3">
                                                <div className="px-4 py-2 border border-red-500/20 bg-red-500/5 text-red-500 flex items-center gap-2 rounded animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{results[order.id].error}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleCreateShipment(order.id)}
                                                    className="text-[9px] font-black text-brand-yellow underline uppercase tracking-widest"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                disabled={processing !== null}
                                                onClick={() => handleCreateShipment(order.id)}
                                                className={`px-6 py-3 bg-brand-yellow text-black text-[9px] font-black uppercase tracking-[0.2em] rounded flex items-center gap-2 transition-all ${processing === order.id ? "opacity-50" : "hover:bg-brand-yellow/80 hover:translate-x-1"}`}
                                            >
                                                {processing === order.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Package className="w-3 h-3" />
                                                )}
                                                {processing === order.id ? "Initiating Protocol..." : "Initiate Fulfillment"}
                                            </button>
                                        )}
                                    </AnimatePresence>
                                </div>
                           </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
