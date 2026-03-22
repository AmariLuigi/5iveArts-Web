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
    Users
} from "lucide-react";
import Link from "next/link";

interface OrderDetailClientProps {
    order: any;
    orderItems: any[];
}

export default function OrderDetailClient({ order, orderItems }: OrderDetailClientProps) {
    const router = useRouter();
    const [status, setStatus] = useState(order.status);
    const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const supabase = createClient();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await axios.patch(`/api/admin/orders/${order.id}`, {
                status,
                tracking_number: trackingNumber || null
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
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Tracking Number</label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Enter tracking ID..."
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-black tracking-widest text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/30"
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
                                    Update Order State
                                </button>
                            </div>
                        </form>
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
                                Carrier Service
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] font-black text-white tracking-widest">
                                <div className="bg-white/5 px-3 py-2 border border-white/5 flex items-center gap-2 w-full">
                                    {order.shipping_service_id || "Standard Carrier"}
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
