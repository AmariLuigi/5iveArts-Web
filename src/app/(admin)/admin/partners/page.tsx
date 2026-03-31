import { fetchPartnerRoster } from "@/app/actions/admin/partners";
import { getPartnerApplications } from "@/app/actions/partner_application";
import { Users, ShieldCheck, Search, Send, ListFilter } from "lucide-react";
import PartnerAdminTable from "@/components/admin/PartnerAdminTable";
import PartnerApplicationsTable from "@/components/admin/PartnerApplicationsTable";
import Link from "next/link";

/**
 * Admin Partner Management Page.
 * Central hub for promoting users to partners and setting commission structures.
 */
export default async function AdminPartnersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; tab?: string }>;
}) {
    const { q, tab = "members" } = await searchParams;
    
    // Fetch data based on active protocol
    const { data: profiles, error: profileErr } = await fetchPartnerRoster(q || "");
    const { data: applications, error: appErr } = await getPartnerApplications();

    const activeCount = profiles?.filter((p: any) => p.is_partner).length || 0;
    const pendingCount = applications?.filter((a: any) => a.status === 'pending').length || 0;

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
                        <p className="text-xl font-black text-white">{activeCount}</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded min-w-[120px]">
                        <p className="text-[8px] font-black uppercase text-neutral-600 tracking-widest mb-1 tabular-nums">Pending Apps</p>
                        <p className="text-xl font-black text-brand-yellow">{pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* Protocol Tabs */}
            <div className="flex items-center gap-6 border-b border-white/5">
                <Link 
                    href={`/admin/partners?tab=members`}
                    className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        tab === 'members' ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-neutral-600 hover:text-white"
                    }`}
                >
                    All Members
                </Link>
                <Link 
                    href={`/admin/partners?tab=applications`}
                    className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                        tab === 'applications' ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-neutral-600 hover:text-white"
                    }`}
                >
                    Candidacy Roster
                    {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-yellow rounded-full animate-ping" />
                    )}
                </Link>
            </div>

            {tab === "members" ? (
                <>
                    {/* Search Protocol */}
                    <form className="relative group max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-brand-yellow transition-colors" />
                        <input
                            name="q"
                            defaultValue={q}
                            placeholder="Search by Email or Referral Tag..."
                            className="w-full bg-[#050505] border border-white/5 rounded-sm pl-10 pr-4 py-3 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow transition-all"
                        />
                        <button type="submit" hidden />
                    </form>

                    {/* User List & Management */}
                    {(profileErr) ? (
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
                </>
            ) : (
                <>
                   {/* Candidacy List */}
                   {appErr ? (
                        <div className="bg-red-500/10 border border-red-500/20 p-10 text-center rounded">
                            <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em]">Protocol Warning: Application Ledger Unreachable</p>
                        </div>
                    ) : (
                        <PartnerApplicationsTable initialData={applications || []} />
                    )}
                </>
            )}
        </div>
    );
}
