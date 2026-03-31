import { fetchPartnerRoster } from "@/app/actions/admin/partners";
import { Users, ShieldCheck, Search } from "lucide-react";
import dynamic from "next/dynamic";

const PartnerAdminTable = dynamic(() => import("../../../../components/admin/PartnerAdminTable"), {
    ssr: false,
    loading: () => <div className="p-20 text-center text-neutral-800 uppercase font-black tracking-widest text-[10px]">Accessing Vault...</div>
}) as any;

/**
 * Admin Partner Management Page.
 * Central hub for promoting users to partners and setting commission structures.
 */
export default async function AdminPartnersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q } = await searchParams;
    const { data: profiles, error } = await fetchPartnerRoster(q || "");

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-brand-yellow" />
                        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow">Partner Network</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Membership Protocol</h1>
                    <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mt-2 italic">
                        Authorize creators and define regional commission payouts.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded min-w-[120px]">
                        <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest mb-1 tabular-nums">Active Partners</p>
                        <p className="text-xl font-black text-white">{profiles?.filter((p: any) => p.is_partner).length || 0}</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded min-w-[120px]">
                        <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest mb-1">Network Capacity</p>
                        <p className="text-xl font-black text-brand-yellow">Protocol 1.0</p>
                    </div>
                </div>
            </div>

            {/* Search Protocol */}
            <form className="relative group max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-brand-yellow transition-colors" />
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search by Email or Referral Tag..."
                    className="w-full bg-[#050505] border border-white/5 rounded-sm pl-10 pr-4 py-3 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow transition-all"
                />
            </form>

            {/* User List & Management */}
            {error ? (
                <div className="bg-red-500/10 border border-red-500/20 p-10 text-center rounded">
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em]">Query Failed: Connection Interrupted</p>
                </div>
            ) : profiles?.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-white/5 p-20 text-center rounded">
                    <Users className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
                    <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">No matching profiles found in database.</p>
                </div>
            ) : (
                <PartnerAdminTable initialData={profiles || []} />
            )}
        </div>
    );
}
