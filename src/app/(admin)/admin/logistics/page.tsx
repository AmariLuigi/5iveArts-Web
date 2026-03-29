import { getSupabaseAdmin } from "@/lib/supabase";
import { ChevronRight, Truck } from "lucide-react";
import Link from "next/link";
import LogisticsClient from "@/app/(admin)/admin/logistics/LogisticsClient";

export const dynamic = "force-dynamic";

export default async function LogisticsAdminPage() {
    const supabase = getSupabaseAdmin() as any;

    // Fetch "Paid" but not yet "Shipped" or "Delivered" orders
    const { data: readyOrders, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["paid", "in_production"])
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading orders: {error.message}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Link href="/admin" className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-brand-yellow transition-colors">Overview</Link>
                        <ChevronRight className="w-3 h-3 text-neutral-800" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-brand-yellow">Logistics</span>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none flex items-center gap-4">
                        <Truck className="w-10 h-10 text-brand-yellow" />
                        Logistics Terminal
                    </h1>
                </div>
            </div>

            <LogisticsClient initialOrders={readyOrders || []} />
        </div>
    );
}
