import { Globe, AlertCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import SettingsManager from "./SettingsManager";

export default async function SettingsPage() {
    const settings = await getSiteSettings();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block animate-in fade-in slide-in-from-bottom-2 duration-700">System Configuration</span>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none animate-in fade-in slide-in-from-bottom-4 duration-1000">Settings</h1>
                </div>

                {!settings.pricing && (
                    <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-sm flex items-center gap-3 text-orange-500 animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Pricing migration pending — using code defaults</span>
                    </div>
                )}
            </div>

            {/* Main Interactive Settings */}
            <SettingsManager initialSettings={settings} />

            {/* Advanced Section */}
            <div className="pt-20 opacity-40">
                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-10 pb-4 border-b border-white/5">Advanced Environment</h3>
                <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-sm space-y-8">
                    <div className="flex items-center gap-6">
                        <Globe className="w-8 h-8 text-neutral-800" />
                        <div>
                            <p className="text-xs font-black uppercase text-white tracking-widest">Base Deployment URL</p>
                            <p className="text-[10px] font-mono text-neutral-600 mt-1 uppercase">{process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}</p>
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
