import { getSupabaseAdmin } from "@/lib/supabase";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import OrdersListClient from "./OrdersListClient";

export const dynamic = "force-dynamic";

export default async function OrdersAdminPage() {
    const supabase = getSupabaseAdmin() as any;

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading orders: {error.message}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Link href="/admin" className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-brand-yellow transition-colors">Overview</Link>
                        <ChevronRight className="w-3 h-3 text-neutral-800" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-brand-yellow">Orders</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">Order Management</h1>
                </div>
            </div>

            <OrdersListClient initialOrders={orders || []} />
        </div>
    );
}
