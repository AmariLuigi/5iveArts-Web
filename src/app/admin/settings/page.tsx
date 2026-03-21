import { Settings as SettingsIcon, Truck, Scale, ShieldCheck, Database, Globe, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export default async function SettingsPage() {
    const settings = await getSiteSettings();

    const configs = [
        {
            title: "Shipping Logistics",
            description: settings.logistics 
                ? `Free over ${settings.logistics.free_shipping_threshold_cents / 100}€ | ${settings.logistics.preparation_days_buffer} day buffer.`
                : "Configure flat-rate tiers and global delivery zones.",
            icon: Truck,
            badge: settings.logistics ? "Database" : "In Code",
            href: "#",
            active: !!settings.logistics
        },
        {
            title: "Pricing Algorithms",
            description: settings.pricing 
                ? `Active Multipliers: 1/6 (${settings.pricing.scales["1/6"]?.multiplier}x), 1/4 (${settings.pricing.scales["1/4"]?.multiplier}x).`
                : "Manage scale multipliers (1/6, 1/4) and finish variants.",
            icon: Scale,
            badge: settings.pricing ? "Database" : "In Code",
            href: "#",
            active: !!settings.pricing
        },
        {
            title: "System Security",
            description: "Verify Stripe webhooks and Supabase connectivity.",
            icon: ShieldCheck,
            badge: "Operational",
            href: "#",
            active: true
        },
        {
            title: "Database Sync",
            description: "Back up product catalog and order history.",
            icon: Database,
            badge: "Auto-Sync",
            href: "#",
            active: true
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">System Configuration</span>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">Settings</h1>
                </div>

                {!settings.pricing && (
                    <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-sm flex items-center gap-3 text-orange-500">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Pricing migration pending</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {configs.map((config) => (
                    <div key={config.title} className="bg-[#0a0a0a] border border-white/5 p-10 group hover:border-white/10 transition-all flex flex-col gap-6 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center group-hover:bg-brand-yellow/10 group-hover:border-brand-yellow/20 transition-all">
                                <config.icon className="w-5 h-5 text-neutral-600 group-hover:text-brand-yellow transition-colors" />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-[2px] border ${config.active ? "text-brand-yellow border-brand-yellow/20 bg-brand-yellow/5" : "text-neutral-700 border-neutral-800 bg-black"}`}>
                                {config.badge}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">{config.title}</h3>
                            <p className="text-xs font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">{config.description}</p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5">
                            {config.active ? (
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Managed in site_settings</span>
                            ) : (
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-800">Migration to Database Pending</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Advanced Section */}
            <div className="pt-20">
                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-10 pb-4 border-b border-white/5">Advanced Environment</h3>
                <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-sm space-y-8">
                    <div className="flex items-center gap-6">
                        <Globe className="w-8 h-8 text-neutral-800" />
                        <div>
                            <p className="text-xs font-black uppercase text-white tracking-widest">Base Deployment URL</p>
                            <p className="text-[10px] font-mono text-neutral-600 mt-1 uppercase">{process.env.NEXT_PUBLIC_BASE_URL || "Not Defined"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/5 text-[10px] font-black uppercase tracking-widest">
                        <div className="space-y-1">
                            <p className="text-neutral-700">Analytics</p>
                            <p className="text-brand-yellow">Disconnected</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-neutral-700">CDN Edge</p>
                            <p className="text-brand-yellow">Active</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-neutral-700">Memory</p>
                            <p className="text-brand-yellow">Optimal</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-neutral-700">Instance</p>
                            <p className="text-brand-yellow">Production</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
