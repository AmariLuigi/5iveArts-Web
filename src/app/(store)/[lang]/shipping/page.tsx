import { Truck, Globe, ShieldCheck, PackageCheck, Clock, RefreshCcw } from "lucide-react";
import { getDictionary, locales } from "@/lib/get-dictionary";
import { Locale } from "@/lib/get-dictionary";
import { getSiteSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/products";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const s = dict.shipping;
    return {
        title: `${s.title} — 5iveArts Global Logistics`,
        description: s.subtitle || "Secure, insured, and tracked delivery for every masterpiece in the collection."
    };
}

export default async function ShippingPage({
    params,
}: {
    params: Promise<{ lang: Locale }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const settings = await getSiteSettings();
    const thresholdCents = settings.logistics?.free_shipping_threshold_cents ?? 25000;
    const thresholdFormatted = formatPrice(thresholdCents);

    const s = dict.shipping;
    const freeTierText = s.freeTierText.replace("{amount}", thresholdFormatted);

    const zones = [
        { name: s.italy, days: s.days1_3 },
        { name: s.eu, days: s.days3_5 },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-4 block">
                    {s.protocol}
                </span>
                <h1 className="text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-none">
                    {s.title}
                </h1>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                    {s.subtitle}
                </p>
            </div>

            {/* Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm hover:border-brand-yellow/30 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-6 h-6 text-brand-yellow" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-3">
                        {s.insuredTitle}
                    </h2>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                        {s.insuredText}
                    </p>
                </div>

                <div className="bg-[#0a0a0a] border border-brand-yellow/20 p-8 rounded-sm hover:bg-brand-yellow/[0.02] transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Truck className="w-24 h-24 text-brand-yellow" />
                    </div>
                    <div className="w-12 h-12 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <RefreshCcw className="w-6 h-6 text-brand-yellow" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-3">
                        {s.dynamicTitle}
                    </h2>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
                        {s.dynamicText}
                    </p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm hover:border-brand-yellow/30 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <PackageCheck className="w-6 h-6 text-brand-yellow" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-3">
                        {s.freeTierTitle}
                    </h2>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                        {freeTierText}
                    </p>
                </div>
            </div>

            {/* Estimates Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden mb-24 backdrop-blur-sm">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
                        {s.zonesTitle}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">{s.carrierActive}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-600">
                                    {s.region}
                                </th>
                                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-600">
                                    {s.estTime}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {zones.map((zone) => (
                                <tr key={zone.name} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-8 py-6 text-sm font-black uppercase text-white tracking-tight group-hover:text-brand-yellow transition-colors">
                                        {zone.name}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-3.5 h-3.5 text-brand-yellow/50 group-hover:text-brand-yellow transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                                                {zone.days}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tracking info */}
            <div className="text-center">
                <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-sm hover:border-brand-yellow/20 transition-colors">
                    <Globe className="w-4 h-4 text-brand-yellow" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                        {s.trackingInfo}
                    </span>
                </div>
            </div>
        </div>
    );
}
