import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Truck, Clock, ShieldCheck, ChevronRight, LayoutDashboard, Settings, AlertTriangle, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/products";

/**
 * User Account / Management Page
 * Shows order history and fulfillment status.
 */
export default async function AccountPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?returnTo=/account");
    }

    // 1. Self-Healing: Claim any guest orders that match this user's email
    await (supabase as any)
        .from("orders")
        .update({ user_id: user.id })
        .eq("customer_email", user.email)
        .is("user_id", null);

    // 2. Fetch the user's orders
    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    const orders = data as any[];
    const isConfirmed = !!user.email_confirmed_at;

    return (
        <div className="min-h-screen bg-black py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Warning Banner for Unconfirmed Users */}
                {!isConfirmed && (
                    <div className="mb-12 bg-orange-500/10 border border-orange-500/30 p-4 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-4 text-orange-500">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest">Verification Required</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-1">
                                    Identity not yet verified. Fulfillment data may be restricted until link is active.
                                </p>
                            </div>
                        </div>
                        <Link 
                            href="/account/settings#verification"
                            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 px-6 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all border border-orange-500/20 flex items-center gap-2"
                        >
                            Resend Verification Link
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                )}
                {/* Header Container */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/5 pb-10">
                    <div>
                        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-3 block">
                            Secure Warehouse Portal
                        </span>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
                            My Account
                        </h1>
                        <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold mt-2">
                             Accessing database for: <span className="text-white/80">{user.email}</span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link 
                            href="/account/settings"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all flex items-center gap-2"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            Security
                        </Link>
                        <form action="/api/auth/signout" method="POST">
                            <button 
                                type="submit"
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest text-red-400 transition-all"
                            >
                                Decommission Session
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Sidebar Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow" />
                            <p className="text-[9px] font-black uppercase text-neutral-600 tracking-widest mb-1">Active Assets</p>
                            <p className="text-3xl font-black text-white">{orders?.length || 0}</p>
                            <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-tight mt-2 italic">Total acquisitions recorded</p>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded">
                            <p className="text-[9px] font-black uppercase text-neutral-600 tracking-widest mb-4">Account Status</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Verified Collector</p>
                                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-tight">Level 1 Encryption</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order History */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center gap-2 mb-8">
                            <LayoutDashboard className="w-4 h-4 text-brand-yellow" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Acquisition History</h2>
                        </div>

                        {error ? (
                            <div className="bg-red-500/10 border border-red-500/20 p-8 text-center rounded">
                                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">Neural Link Error</p>
                                <p className="text-neutral-500 text-[9px] mt-2 uppercase tracking-widest font-bold">Failed to synchronize with central order vault.</p>
                            </div>
                        ) : orders?.length === 0 ? (
                            <div className="bg-[#0a0a0a] border border-dashed border-white/10 p-20 text-center rounded">
                                <Package className="w-12 h-12 text-neutral-800 mx-auto mb-6" />
                                <p className="text-neutral-500 text-[11px] font-black uppercase tracking-widest">No assets recorded in your vault yet.</p>
                                <Link href="/products" className="mt-8 inline-block hasbro-btn-primary px-10 py-4 text-[10px]">
                                    Browse Collection
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders?.map((order) => (
                                    <div key={order.id} className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden hover:border-white/10 transition-all group">
                                        <div className="flex flex-col md:flex-row border-b border-white/5">
                                            <div className="p-6 flex-grow">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest tabular-nums">
                                                        Order #{order.id.slice(0, 8)}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        order.status === 'paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                                                        'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-neutral-500 text-[9px] uppercase tracking-widest font-bold">
                                                    Recorded: {new Date(order.created_at).toLocaleDateString(undefined, { 
                                                        year: 'numeric', month: 'long', day: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                            <div className="p-6 bg-white/[0.02] md:border-l border-white/5 flex items-center justify-between md:justify-center md:flex-col gap-2 min-w-[140px]">
                                                <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Investment</span>
                                                <span className="text-lg font-black text-brand-yellow tabular-nums">{formatPrice(order.total_pence)}</span>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="space-y-4">
                                                {(order as any).order_items?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center bg-white/[0.01] p-3 rounded-sm border border-white/5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 bg-brand-yellow/10 rounded flex items-center justify-center">
                                                                <Package className="w-4 h-4 text-brand-yellow/50" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">{item.product_name}</p>
                                                                <p className="text-[8px] text-neutral-600 uppercase font-bold tracking-tight">Quantity: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-neutral-400 tabular-nums">
                                                            {formatPrice(item.product_price_pence * item.quantity)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-neutral-700" />
                                                        <span className="text-[9px] font-black uppercase text-neutral-500 tracking-widest italic">Prep Phase Active</span>
                                                    </div>
                                                    {order.tracking_number && (
                                                        <div className="flex items-center gap-2">
                                                            <Truck className="w-3.5 h-3.5 text-brand-yellow" />
                                                            <span className="text-[9px] font-black uppercase text-brand-yellow tracking-widest">In Transit: {order.tracking_number}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <Link 
                                                    href={`/account/orders/${order.id}`}
                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all group/btn"
                                                >
                                                    Full Logistics Data
                                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
