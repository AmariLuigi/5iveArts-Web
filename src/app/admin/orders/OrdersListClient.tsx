"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/products";
import { ChevronRight, Filter, Search, Inbox } from "lucide-react";
import Link from "next/link";

interface OrdersListClientProps {
    initialOrders: any[];
}

export default function OrdersListClient({ initialOrders }: OrdersListClientProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOrders = orders.filter(o =>
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
            case "processing": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
            case "shipped": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
            case "delivered": return "text-green-400 bg-green-500/10 border-green-500/20";
            case "cancelled": return "text-red-400 bg-red-500/10 border-red-500/20";
            default: return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
        }
    };

    return (
        <div className="space-y-12">
            {/* Search & Filter Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, ID or status..."
                        className="bg-white/5 border border-white/5 py-3 pl-12 pr-6 text-[10px] uppercase font-black tracking-widest text-white placeholder:text-neutral-700 focus:outline-none focus:border-brand-yellow/50 transition-all rounded-sm w-full"
                    />
                </div>
                <button className="p-3 bg-white/5 border border-white/5 text-neutral-500 hover:text-brand-yellow transition-colors rounded-sm">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">Order ID</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">Customer</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">Date</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">Status</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">Amount</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-neutral-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs text-neutral-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase text-white">{order.customer_name}</span>
                                                <span className="text-[10px] font-bold text-neutral-500 lowercase">{order.customer_email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                                {new Date(order.created_at).toLocaleDateString('it-IT')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-1 rounded-[2px] border text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-black text-white text-xs">
                                            {formatPrice(order.total_pence)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-brand-yellow transition-all"
                                            >
                                                Manage →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-32 text-center">
                                        <Inbox className="w-12 h-12 text-neutral-900 mx-auto mb-4" />
                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-600">
                                            {searchTerm ? "No orders match this protocol" : "The Archives are Empty"}
                                        </p>
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
