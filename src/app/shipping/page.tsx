import { Truck, Globe, ShieldCheck, PackageCheck, Clock } from "lucide-react";

export default function ShippingPage() {
    const zones = [
        { name: "Italy", standard: "€4.99", express: "€8.99", days: "1-3 Days" },
        { name: "European Union", standard: "€8.99", express: "€14.99", days: "3-5 Days" },
        { name: "United Kingdom", standard: "€12.99", express: "€19.99", days: "4-7 Days" },
        { name: "Global / Rest of World", standard: "€14.99", express: "€24.99", days: "7-14 Days" },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-20">
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-4 block">Logistics Protocol</span>
                <h1 className="text-6xl font-black uppercase tracking-tighter text-white mb-6">Global Shipping</h1>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                    Secure, insured, and tracked delivery for every masterpiece in the collection.
                </p>
            </div>

            {/* Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-sm">
                    <div className="w-12 h-12 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mb-8">
                        <Truck className="w-6 h-6 text-brand-yellow" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4">Insured Fulfillment</h2>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                        Every figure is packed using custom-fit high-density foam and double-walled collector boxes. We insure every shipment against loss or damage during transit.
                    </p>
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-sm">
                    <div className="w-12 h-12 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mb-8">
                        <PackageCheck className="w-6 h-6 text-brand-yellow" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4">Free Shipping Tier</h2>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                        We reward serious collectors. All orders over <span className="text-white">€50.00</span> automatically qualify for <span className="text-brand-yellow">FREE STANDARD SHIPPING</span>, regardless of your location.
                    </p>
                </div>
            </div>

            {/* Rates Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden mb-24">
                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Shipping Zones & Rates</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-600">Region</th>
                                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-600">Standard</th>
                                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-600">Express</th>
                                <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-neutral-600">Est. Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {zones.map((zone) => (
                                <tr key={zone.name} className="hover:bg-white/[0.01] transition-colors">
                                    <td className="px-8 py-6 text-sm font-black uppercase text-white tracking-tight">{zone.name}</td>
                                    <td className="px-8 py-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">{zone.standard}</td>
                                    <td className="px-8 py-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">{zone.express}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-3.5 h-3.5 text-brand-yellow" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">{zone.days}</span>
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
                <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/5 rounded-sm">
                    <Globe className="w-4 h-4 text-neutral-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Live Global Tracking Provided on All Orders</span>
                </div>
            </div>
        </div>
    );
}
