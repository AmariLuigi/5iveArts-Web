"use client";

import { useState, useMemo } from "react";
import { formatPrice } from "@/lib/products";
import { ChevronRight, Filter, Search, Inbox, ChevronDown, AlertCircle, Sparkles, Truck, Package, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";

interface OrdersListClientProps {
    initialOrders: any[];
}

type TabType = 'all' | 'action' | 'active' | 'completed';

export default function OrdersListClient({ initialOrders }: OrdersListClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const needsAction = (order: any) => {
        const s = order.status;
        if (order.is_custom) {
            if (s === 'analyzing') return true; // Needs quote
            if (s === 'in_production') return true; // Needs progress updates
            if (s === 'ready_to_ship') return true; // Needs final payment link
            if (s === 'paid') return true; // Needs shipping
        } else {
            if (s === 'paid' || s === 'processing') return true; // Needs shipping
        }
        if (order.carrier_delivered && s === 'shipped') return true; // Check if delivered finally
        return false;
    };

    const filteredOrders = useMemo(() => {
        return initialOrders.filter(o => {
            const matchesSearch = 
                (o.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (o.customer_email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (o.id?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || o.status === statusFilter;

            let matchesTab = true;
            if (activeTab === 'action') matchesTab = needsAction(o);
            else if (activeTab === 'active') matchesTab = !['delivered', 'cancelled', 'refunded'].includes(o.status);
            else if (activeTab === 'completed') matchesTab = o.status === 'delivered';

            return matchesSearch && matchesStatus && matchesTab;
        });
    }, [initialOrders, searchTerm, statusFilter, activeTab]);

    const stats = useMemo(() => {
        return {
            action: initialOrders.filter(needsAction).length,
            active: initialOrders.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status)).length,
            all: initialOrders.length
        };
    }, [initialOrders]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
            case "processing": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
            case "shipped": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
            case "delivered": return "text-green-400 bg-green-500/10 border-green-500/20";
            case "cancelled": return "text-red-400 bg-red-500/10 border-red-500/20";
            case "analyzing": return "text-orange-400 bg-orange-500/5 border-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.05)]";
            case "quoted": return "text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20";
            case "in_production": return "text-brand-yellow bg-brand-yellow/5 border-brand-yellow/10";
            case "ready_to_ship": return "text-brand-yellow bg-brand-yellow/5 border-brand-yellow/30";
            default: return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
        }
    };

    const getActionLabel = (order: any) => {
        if (!needsAction(order)) return null;
        if (order.is_custom) {
            if (order.status === 'analyzing') return "Set Quote";
            if (order.status === 'in_production') return "Log Gallery";
            if (order.status === 'ready_to_ship') return "Req Final";
            if (order.status === 'paid') return "Initiate Ship";
        } else {
            if (order.status === 'paid' || order.status === 'processing') return "Shipment Req";
        }
        if (order.carrier_delivered) return "Carrier Delivered";
        return "Action Needed";
    };

    return (
        <div className="space-y-10">
            {/* Quick Stats & Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { id: 'all', label: 'Total Logs', value: stats.all, icon: Inbox },
                    { id: 'action', label: 'Action Required', value: stats.action, icon: AlertCircle, color: 'text-orange-500', alert: stats.action > 0 },
                    { id: 'active', label: 'Active Deployments', value: stats.active, icon: Sparkles },
                    { id: 'completed', label: 'Secured', value: stats.all - stats.active - (initialOrders.filter(o => ['cancelled', 'refunded'].includes(o.status)).length), icon: CheckCircle2 }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`p-6 text-left rounded-sm border transition-all ${
                            activeTab === tab.id 
                            ? "bg-white/[0.03] border-brand-yellow/30 shadow-[0_4px_20px_rgba(234,179,8,0.1)]" 
                            : "bg-black/40 border-white/5 hover:border-white/10"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-yellow' : 'text-neutral-700'}`} />
                            {tab.alert && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
                        </div>
                        <p className="text-[20px] font-black text-white italic tracking-tighter mb-1">{tab.value}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-brand-yellow' : 'text-neutral-600'}`}>{tab.label}</p>
                    </button>
                ))}
            </div>

            {/* Search & Filter Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 border-y border-white/5">
                <div className="flex items-center gap-6">
                    <Filter className="w-4 h-4 text-brand-yellow" />
                    <div className="flex gap-2">
                        {['all', 'action', 'active', 'completed'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t as TabType)}
                                className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-full border transition-all ${
                                    activeTab === t ? "bg-brand-yellow text-black border-brand-yellow" : "bg-transparent text-neutral-500 border-white/10 hover:border-white/20"
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 max-w-2xl">
                    <div className="relative group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Logs..."
                            className="bg-black/40 border border-white/5 py-3 pl-12 pr-6 text-[9px] uppercase font-black tracking-[0.2em] text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/50 transition-all rounded-sm w-full"
                        />
                    </div>
                    
                    <div className="min-w-[180px] w-full md:w-auto">
                        <CustomSelect
                            value={statusFilter}
                            onChange={(val: string) => setStatusFilter(val)}
                            options={[
                                { code: "all", name: "Status: All" },
                                { code: "paid", name: "Paid" },
                                { code: "processing", name: "Processing" },
                                { code: "shipped", name: "Shipped" },
                                { code: "delivered", name: "Delivered" },
                                { code: "analyzing", name: "Analyzing" },
                                { code: "quoted", name: "Quoted" },
                                { code: "in_production", name: "Forging" },
                                { code: "ready_to_ship", name: "Finalized" },
                                { code: "cancelled", name: "Cancelled" },
                                { code: "refunded", name: "Refunded" }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#050505] border border-white/5 rounded-sm overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-neutral-600">Deployment ID</th>
                                <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-neutral-600">Acquisition Agent</th>
                                <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-neutral-600 text-center">Protocol Status</th>
                                <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-neutral-600 text-right">Investment</th>
                                <th className="px-8 py-5 text-[9px] uppercase font-black tracking-widest text-neutral-600 text-right">Action Interface</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    const action = getActionLabel(order);
                                    return (
                                        <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-[10px] text-white font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
                                                    <span className="text-[7px] font-black uppercase text-neutral-700 tracking-[0.2em] mt-1">
                                                        {new Date(order.created_at).toLocaleDateString('it-IT', { dateStyle: 'medium' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black uppercase text-white tracking-widest">{order.customer_name}</span>
                                                    <span className="text-[8px] font-bold text-neutral-600 lowercase tracking-widest">{order.customer_email}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`px-3 py-1.5 rounded-[2px] border text-[8px] font-black uppercase tracking-[0.2em] ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                    {order.is_custom && (
                                                        <span className="text-[6px] font-black text-brand-yellow/40 uppercase tracking-[0.3em]">Artisan Commission</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-black text-white italic">{formatPrice(order.total_pence)}</span>
                                                    {order.deposit_pence > 0 && (
                                                        <span className="text-[7px] font-black uppercase text-green-500/50 mt-1">Partial Secured</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    {action && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-[2px] animate-pulse">
                                                            <AlertCircle className="w-2.5 h-2.5 text-orange-500" />
                                                            <span className="text-[7px] font-black uppercase text-orange-500 tracking-widest">{action}</span>
                                                        </div>
                                                    )}
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="px-4 py-2 bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-neutral-400 hover:text-brand-yellow hover:bg-brand-yellow/5 hover:border-brand-yellow/30 transition-all rounded-sm"
                                                    >
                                                        Access Intel →
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-40 text-center">
                                        <Inbox className="w-16 h-16 text-neutral-900 mx-auto mb-6" />
                                        <div className="space-y-2">
                                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white italic">Protocol Intercept: No Records Found</p>
                                            <p className="text-[8px] uppercase font-bold text-neutral-700 tracking-widest">Adjust filters to re-initialize search</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
