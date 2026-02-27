import { getSupabaseAdmin } from "@/lib/supabase";
import { LogOut, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/products";

export default async function AdminDashboard() {
    const supabase = getSupabaseAdmin() as any;

    // Fetch some quick stats
    const { data: orders } = await supabase.from("orders").select("*");
    const { data: products } = await supabase.from("products").select("*");

    const totalRevenue = orders?.reduce((acc: number, order: any) => acc + (order.total_pence || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const totalItems = products?.length || 0;

    const stats = [
        { label: "Total Revenue", value: formatPrice(totalRevenue), icon: TrendingUp, color: "text-brand-yellow" },
        { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "text-blue-500" },
        { label: "Active Products", value: totalItems, icon: Package, color: "text-purple-500" },
        { label: "Unfulfilled", value: orders?.filter((o: any) => o.status !== "delivered").length || 0, icon: Users, color: "text-orange-500" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">Central Command</span>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">Admin Overview</h1>
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/admin/orders"
                        className="px-6 py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all rounded-sm"
                    >
                        View Orders
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-brand-yellow text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all rounded-sm"
                    >
                        Visit Shop
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm shadow-xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                            <stat.icon className={`w-12 h-12 ${stat.color}`} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">{stat.label}</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Recent Shipments</h3>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-sm p-12 text-center">
                        <Package className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">No recent orders found</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">System Status</h3>
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-neutral-500">Stripe API</span>
                            <span className="text-brand-yellow">Operational</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-neutral-500">Supabase</span>
                            <span className="text-brand-yellow">Healthy</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-neutral-500">Postmark/Resend</span>
                            <span className="text-brand-yellow">Enabled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
