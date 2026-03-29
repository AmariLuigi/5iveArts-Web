"use client";

import { 
    ChevronLeft, 
    Package, 
    Truck, 
    MapPin, 
    Calendar,
    CreditCard,
    ExternalLink,
    ChevronRight,
    CheckCircle2,
    ShieldCheck,
    Box,
    History,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice } from "@/lib/products";

interface OrderLogisticsClientProps {
    order: any;
    orderItems: any[];
    progressMedia: any[];
    dict: any;
    lang: string;
}

type TrackingStatus = "in_transit" | "out_for_delivery" | "delivered" | "exception" | "unknown";

export default function OrderLogisticsClient({ order, orderItems, progressMedia, dict, lang }: OrderLogisticsClientProps) {
    const router = useRouter();
    const [loadingDelivery, setLoadingDelivery] = useState(false);
    const [trackingData, setTrackingData] = useState<any>(null);
    const [loadingTracking, setLoadingTracking] = useState(false);

    const [selectedServiceId, setSelectedServiceId] = useState(order.carrier_service_id || "");
    const [isUpdatingLogistics, setIsUpdatingLogistics] = useState(false);

    // Dynamic Tracking Fetch
    useEffect(() => {
        if (order.tracking_number && (order.status === 'shipped' || order.status === 'delivered')) {
            const fetchTracking = async () => {
                setLoadingTracking(true);
                try {
                    const res = await axios.get(`/api/orders/${order.id}/tracking`);
                    setTrackingData(res.data);
                } catch (err: any) {
                    console.error("Tracking fetch failed:", err);
                    if (err.response?.data?.trackingUrl) {
                        setTrackingData({ 
                            trackingUrl: err.response.data.trackingUrl,
                            movements: [],
                            carrier: order.shipping_service_name || "Regional Carrier"
                        });
                    }
                } finally {
                    setLoadingTracking(false);
                }
            };
            fetchTracking();
        }
    }, [order.tracking_number, order.status, order.id, order.shipping_service_name]);

    const getStatusColor = (s: string) => {
        switch (s) {
            case "paid": 
            case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "in_production": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "ready_to_ship": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case "shipped": return "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20";
            case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20";
            default: return "bg-neutral-500/10 text-neutral-500 border-white/5";
        }
    };

    const cleanState = (state: string) => {
        if (!state) return "";
        if (state.length > 2 && state.includes("(")) {
            const match = state.match(/\(([^)]+)\)/);
            return match ? match[1] : state;
        }
        return state;
    };

    const handleMarkAsDelivered = async () => {
        setLoadingDelivery(true);
        try {
            await axios.patch(`/api/orders/${order.id}`, { status: 'delivered' });
            router.refresh();
        } catch (err) {
            console.error("Failed to update delivery status:", err);
        } finally {
            setLoadingDelivery(false);
        }
    };

    const handleSelectLogistics = async (serviceId: string) => {
        setIsUpdatingLogistics(true);
        try {
            const selectedOpt = (order.shipping_options || []).find((o: any) => String(o.service_id) === String(serviceId));
            if (!selectedOpt) return;

            await axios.patch(`/api/orders/${order.id}/logistics`, {
                service_id: serviceId,
                carrier_name: selectedOpt.carrier_name,
                service_name: selectedOpt.service_name,
                price_pence: selectedOpt.price
            });
            
            setSelectedServiceId(serviceId);
            router.refresh();
        } catch (err) {
            console.error("Failed to update logistics:", err);
        } finally {
            setIsUpdatingLogistics(false);
        }
    };

    const generateInvoice = () => {
        const doc = new jsPDF();
        const orderIdShort = order.id.slice(0, 8).toUpperCase();

        // Branding
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 40, "F");
        doc.setFontSize(22);
        doc.setTextColor(255, 159, 0); // brand-yellow
        doc.setFont("helvetica", "bold");
        doc.text("5IVE ARTS", 20, 25);
        
        doc.setFontSize(10);
        doc.text("LOGISTICS MANIFEST // OFFICIAL INVOICE", 140, 25);

        // Header Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`DATE: ${new Date(order.created_at).toLocaleDateString()}`, 20, 55);
        doc.text(`ORDER ID: ${orderIdShort}`, 20, 62);
        doc.text(`STATUS: ${order.status.toUpperCase()}`, 20, 69);

        doc.setFontSize(12);
        doc.text(dict.orders.deploymentZone.toUpperCase(), 120, 55);
        doc.setFont("helvetica", "normal");
        const addr = order.shipping_address;
        doc.text(order.customer_name || "", 120, 62);
        doc.text(addr?.street1 || "", 120, 68);
        if (addr?.street2) doc.text(addr.street2, 120, 74);
        doc.text(`${addr?.city || ""}${addr?.state ? `, ${addr.state}` : ""} ${addr?.zip_code || ""}`, 120, addr?.street2 ? 80 : 74);
        doc.text(addr?.country || "", 120, addr?.street2 ? 86 : 80);

        // Table Manifest
        const tableData = orderItems.map((item) => [
            item.product_name,
            String(item.quantity),
            formatPrice(item.product_price_pence),
            formatPrice(item.product_price_pence * item.quantity),
        ]);

        autoTable(doc, {
            startY: 100,
            head: [[dict.orders.itemDetails, dict.orders.qty, dict.products.price, dict.cart.subtotal]],
            body: tableData,
            headStyles: { fillColor: [20, 20, 20], textColor: [255, 159, 0], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            margin: { left: 20, right: 20 },
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.text(`${dict.orders.subtotal}: ${formatPrice(order.subtotal_pence)}`, 140, finalY);
        doc.text(`${dict.orders.shipping}: ${formatPrice(order.shipping_pence)}`, 140, finalY + 7);
        
        if (order.is_custom) {
            doc.text(`${dict.orders.depositPaid || "Paid Deposit"}: ${formatPrice(order.deposit_pence || 0)}`, 140, finalY + 14);
            const remaining = order.total_pence - (order.deposit_pence || 0) - (order.final_payment_pence || 0);
            if (remaining > 0) {
                doc.text(`${dict.orders.remainingBalance || "Remainder"}: ${formatPrice(remaining)}`, 140, finalY + 21);
            }
        }

        doc.setFontSize(14);
        doc.setTextColor(255, 159, 0);
        doc.text(`${dict.orders.totalContribution.toUpperCase()}: ${formatPrice(order.total_pence)}`, 140, finalY + (order.is_custom ? 30 : 17));

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`ENCRYPTED TRANSACTION | ${dict.orders.transactionSecure.toUpperCase()} | 5IVE ARTS HQ`, 105, 285, { align: "center" });

        doc.save(`Invoice_${orderIdShort}.pdf`);
    };

    return (
        <div className="min-h-screen bg-black py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">
                
                <div className="flex items-center gap-2">
                    <Link href={`/${lang}/account`} className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-brand-yellow transition-colors flex items-center gap-1 group">
                        <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        {dict.orders.backToWarehouse}
                    </Link>
                    <ChevronRight className="w-3 h-3 text-neutral-900" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-yellow">{dict.orders.reportTitle}</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/5">
                    <div>
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic">
                                {dict.orders.operation}{order.id.slice(0, 8).toUpperCase()}
                            </h1>
                            <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] ${getStatusColor(order.status)}`}>
                                {(dict.orders as any)[order.status] || order.status}
                            </span>
                            {order.carrier_delivered && order.status !== 'delivered' && (
                                <span className="bg-green-500/10 text-green-500 border border-green-500/30 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                                    Marked as Delivered by Carrier
                                </span>
                            )}
                        </div>
                        <div className="flex wrap items-center gap-6 text-neutral-500">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{dict.orders.logged} {new Date(order.created_at).toLocaleDateString(lang, { dateStyle: 'long' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{dict.orders.verifiedAcquisition}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {(order.status === 'shipped') && (
                            <button 
                                onClick={handleMarkAsDelivered}
                                disabled={loadingDelivery}
                                className={`hasbro-btn-primary px-8 py-4 text-[10px] font-black flex items-center gap-2 shadow-[0_4px_15px_rgba(234,179,8,0.3)] ${order.carrier_delivered ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black' : 'animate-glow'}`}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {loadingDelivery ? "Authorizing..." : "Verify Delivery"}
                            </button>
                        )}
                        <button onClick={generateInvoice} className="hasbro-btn-secondary px-8 py-4 text-[10px] font-black uppercase tracking-widest border border-white/10 hover:border-white/30 transition-all flex items-center gap-2">
                            Download Invoice
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        
                        <div className="space-y-10">
                            <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
                                <History className="w-4 h-4 text-brand-yellow" />
                                Timeline Protocol
                            </h3>
                            <div className="flex justify-between relative overflow-hidden pb-4">
                                <div className="absolute top-4 left-0 w-full h-px bg-white/5 z-0" />
                                {(() => {
                                    const customStages = [
                                        { id: 'paid', label: 'Authorized', icon: CheckCircle2, active: ['paid', 'processing', 'in_production', 'ready_to_ship', 'shipped', 'delivered'] },
                                        { id: 'in_production', label: 'Fabrication', icon: Box, active: ['in_production', 'ready_to_ship', 'shipped', 'delivered'] },
                                        { id: 'ready_to_ship', label: 'QC Passed', icon: ShieldCheck, active: ['ready_to_ship', 'shipped', 'delivered'] },
                                        { id: 'shipped', label: 'Deployment', icon: Truck, active: ['shipped', 'delivered'] },
                                        { id: 'delivered', label: 'Delivered', icon: MapPin, active: ['delivered'] }
                                    ];

                                    const stdStages = [
                                        { id: 'paid', label: 'Confirmed', icon: CheckCircle2, active: ['paid', 'processing', 'shipped', 'delivered'] },
                                        { id: 'processing', label: 'Preparing', icon: Box, active: ['processing', 'shipped', 'delivered'] },
                                        { id: 'shipped', label: 'In Transit', icon: Truck, active: ['shipped', 'delivered'] },
                                        { id: 'delivered', label: 'Received', icon: MapPin, active: ['delivered'] }
                                    ];

                                    const stages = order.is_custom ? customStages : stdStages;

                                    return stages.map((s, i) => {
                                        const isPast = s.active.includes(order.status);
                                        const isCurrent = order.status === s.id;
                                        const Icon = s.icon;

                                        return (
                                            <div key={s.id} className="flex md:flex-col items-center gap-4 md:gap-3 relative z-10 group">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                                                    isPast ? 'bg-brand-yellow border-brand-yellow shadow-[0_0_15px_rgba(255,160,0,0.3)]' : 'bg-black border-white/10'
                                                }`}>
                                                    <Icon className={`w-3.5 h-3.5 ${isPast ? 'text-black' : 'text-neutral-700'}`} />
                                                </div>
                                                <div className="flex flex-col md:items-center text-left md:text-center">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isPast ? 'text-white' : 'text-neutral-700'}`}>{s.label}</span>
                                                    {isCurrent && (
                                                        <span className="text-[7px] text-brand-yellow font-black uppercase tracking-widest animate-pulse mt-1">Status Active</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Tracking Data Timeline */}
                        {trackingData && (
                            <div className="space-y-6">
                                <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
                                    <Truck className="w-4 h-4 text-brand-yellow" />
                                    Carrier Tracking Protocol
                                </h3>
                                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded space-y-8">
                                    <div className="flex items-center justify-between pb-6 border-b border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Carrier Network</span>
                                            <span className="text-[11px] font-black text-white uppercase">{trackingData.carrier}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Latest Vault Update</span>
                                            <span className="text-[11px] font-black text-brand-yellow uppercase">{new Date(trackingData.lastUpdated).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {trackingData.movements.map((move: any, idx: number) => (
                                            <div key={idx} className="flex gap-6 group">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-brand-yellow animate-pulse shadow-[0_0_10px_rgba(255,160,0,0.5)]' : 'bg-neutral-800'} z-10 transition-colors`} />
                                                    {idx !== trackingData.movements.length - 1 && (
                                                        <div className="w-px h-full bg-white/5 group-hover:bg-white/10 transition-colors" />
                                                    )}
                                                </div>
                                                <div className="pb-6">
                                                    <div className="flex flex-wrap items-baseline gap-3 mb-1">
                                                        <span className="text-[9px] font-black text-white tracking-widest uppercase">{new Date(move.timestamp).toLocaleDateString()}</span>
                                                        <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest underline decoration-brand-yellow/30">{move.location}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-neutral-400 leading-relaxed uppercase tracking-widest">{move.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {trackingData.movements.length === 0 && (
                                        <div className="py-12 flex flex-col items-center justify-center text-neutral-700 italic border-t border-white/5">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-6">Real-time status analysis restricted or unavailable.</p>
                                            
                                            {trackingData.trackingUrl && (
                                                <a 
                                                    href={trackingData.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hasbro-btn-secondary px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group border border-brand-yellow/30 hover:bg-brand-yellow/10"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 text-brand-yellow" />
                                                    Track on Carrier Website
                                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </a>
                                            )}
                                            
                                            {!trackingData.trackingUrl && (
                                                <>
                                                    <Loader2 className="w-6 h-6 mb-3 animate-spin opacity-20" />
                                                    <span className="text-[10px] uppercase font-black tracking-widest">Handshaking with Carrier API...</span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {trackingData.movements.length > 0 && trackingData.trackingUrl && (
                                        <div className="pt-6 border-t border-white/5 flex justify-end">
                                            <a 
                                                href={trackingData.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] font-black uppercase text-brand-yellow flex items-center gap-2 hover:brightness-110 transition-all opacity-60 hover:opacity-100"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View Live carrier details
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Progress Gallery (Order Journal) */}
                        {progressMedia.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
                                    <History className="w-4 h-4 text-brand-yellow" />
                                    Fabrication Journal
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {progressMedia.map((media) => (
                                        <div key={media.id} className="group relative aspect-[4/5] bg-neutral-900 overflow-hidden border border-white/5">
                                            <img 
                                                src={media.url} 
                                                alt={media.stage} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest mb-1">{media.stage}</p>
                                                        <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{new Date(media.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manifest Table */}
                        <div className="space-y-6">
                            <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
                                <Package className="w-4 h-4 text-brand-yellow" />
                                {dict.orders.manifest}
                            </h3>
                            <div className="bg-[#0a0a0a] border border-white/5 rounded overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.03] border-b border-white/5">
                                            <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-500">{dict.orders.itemDetails}</th>
                                            <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-500 text-center">{dict.orders.qty}</th>
                                            <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-500 text-right">{dict.account.investment}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orderItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black uppercase text-white tracking-widest leading-none mb-1">{item.product_name}</span>
                                                        <span className="text-[9px] font-black uppercase text-neutral-700 tracking-tighter">{dict.orders.sku} {item.product_id.slice(0,12)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center text-xs font-black text-white tabular-nums">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-8 py-6 text-right text-xs font-black text-white tabular-nums">
                                                    {formatPrice(item.product_price_pence)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-white/[0.01]">
                                        <tr className="border-t border-white/5">
                                            <td colSpan={2} className="px-8 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600">{dict.orders.subtotal}</td>
                                            <td className="px-8 py-4 text-right text-xs font-black text-white">{formatPrice(order.subtotal_pence)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className="px-8 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-600 border-t border-white/5">{dict.orders.shipping}</td>
                                            <td className="px-8 py-4 text-right text-xs font-black text-white border-t border-white/5">{formatPrice(order.shipping_pence)}</td>
                                        </tr>
                                        <tr className="border-t-2 border-brand-yellow/30 bg-brand-yellow/[0.02]">
                                            <td colSpan={2} className="px-8 py-6 text-[11px] uppercase font-black tracking-[0.2em] text-brand-yellow">{dict.orders.totalContribution}</td>
                                            <td className="px-8 py-6 text-right text-2xl font-black text-brand-yellow leading-none tracking-tighter">{formatPrice(order.total_pence)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded space-y-8">
                            <div>
                                <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-brand-yellow" />
                                    {dict.orders.deploymentZone}
                                </h3>
                                <div className="space-y-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400 leading-relaxed">
                                    <p className="text-white font-black mb-2 flex items-center gap-2">
                                        {order.customer_name}
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    </p>
                                    <p>{order.shipping_address?.street1}</p>
                                    {order.shipping_address?.street2 && <p>{order.shipping_address?.street2}</p>}
                                    <p>
                                        {order.shipping_address?.city || "Standard Logistics Zone"}
                                        {order.shipping_address?.state && cleanState(order.shipping_address.state) && `, ${cleanState(order.shipping_address.state)}`} 
                                        {` ${order.shipping_address?.zip_code || ""}`}
                                    </p>
                                    <p className="text-white brightness-75">
                                        {order.shipping_address?.country || "International"}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
                                    <Truck className="w-4 h-4 text-brand-yellow" />
                                    {dict.orders.carrierProtocol}
                                </h3>
                                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm">
                                    <p className="text-[11px] font-black text-white uppercase tracking-widest flex items-center justify-between">
                                        {order.shipping_service_name || order.shipping_service_id || "Standard Logistics"}
                                        <ShieldCheck className="w-4 h-4 text-brand-yellow" />
                                    </p>
                                    <p className="text-[9px] text-neutral-500 uppercase font-black mt-2">{dict.orders.class}</p>
                                </div>
                            </div>

                             <div className="pt-8 border-t border-white/5 space-y-4">
                                 <h3 className="text-[11px] uppercase font-black tracking-[0.4em] text-white/40 mb-6 flex items-center gap-3">
                                    <CreditCard className="w-4 h-4 text-brand-yellow" />
                                    {dict.orders.settlement}
                                </h3>
                                
                                {order.payment_link && (order.status === 'quoted' || order.status === 'analyzing' || order.status === 'ready_to_ship') ? (
                                    <div className="space-y-4">
                                        {(order.status === 'quoted' || order.status === 'analyzing') && (
                                            <div className="space-y-6 mb-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white">
                                                        {dict.orders.selectCarrier || "Select Shipping Protocol"}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                                                        {dict.orders.selectCarrierNote || "Selection only fixes future cost."}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 gap-3">
                                                    {(order.shipping_options || []).map((opt: any) => {
                                                        const isSelected = String(opt.service_id) === String(selectedServiceId);
                                                        return (
                                                            <button
                                                                key={opt.service_id}
                                                                type="button"
                                                                disabled={isUpdatingLogistics}
                                                                onClick={() => handleSelectLogistics(opt.service_id)}
                                                                className={`p-4 border text-left transition-all rounded-sm flex flex-col gap-1 ${
                                                                    isSelected 
                                                                    ? "bg-brand-yellow/10 border-brand-yellow shadow-[0_0_15px_rgba(255,160,0,0.1)]" 
                                                                    : "bg-black border-white/5 hover:border-white/20"
                                                                } ${isUpdatingLogistics ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-yellow' : 'bg-neutral-800'}`} />
                                                                        <span className="text-[10px] font-black uppercase text-white">{opt.carrier_name}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-brand-yellow font-mono">{formatPrice(opt.price)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center pl-4">
                                                                    <span className="text-[8px] font-bold uppercase text-neutral-600">{opt.service_name}</span>
                                                                    <span className="text-[8px] font-black uppercase text-neutral-700 tracking-widest">{opt.estimated_days} {dict.orders.daysEst}</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <a 
                                            href={(order.status === 'quoted' || order.status === 'analyzing') && !selectedServiceId ? "#" : order.payment_link}
                                            className={`w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm shadow-[0_0_20px_rgba(255,160,0,0.1)] group ${
                                                ((order.status === 'quoted' || order.status === 'analyzing') && !selectedServiceId)
                                                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5"
                                                : "bg-brand-yellow text-black hover:bg-brand-yellow/80 hover:scale-[1.02]"
                                            }`}
                                        >
                                            <CreditCard className="w-3.5 h-3.5" />
                                            {(order.status === 'quoted' || order.status === 'analyzing') ? "Authorize 50% Protocol Deposit" : "Settle Final Balance"}
                                            <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className={`px-4 py-2 rounded-[2px] text-[9px] font-black uppercase tracking-widest border ${
                                            ['paid', 'shipped', 'delivered', 'in_production', 'ready_to_ship'].includes(order.status)
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                            : 'bg-neutral-500/10 text-neutral-500 border-white/5'
                                        }`}>
                                            {['paid', 'shipped', 'delivered', 'in_production', 'ready_to_ship'].includes(order.status) 
                                                ? "Transaction Layer Secured" 
                                                : "Analysis in Progress..."}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-brand-yellow/[0.02] border border-brand-yellow/10 p-8 rounded text-center">
                            <p className="text-[10px] font-black uppercase text-brand-yellow tracking-widest mb-4">{dict.orders.discrepancy}</p>
                            <button className="text-[9px] font-black uppercase text-white border-b border-brand-yellow/50 pb-1 hover:text-brand-yellow transition-colors">
                                {dict.orders.contactHQ}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
