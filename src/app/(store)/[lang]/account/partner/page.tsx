import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { 
    LayoutDashboard, 
    ArrowLeft, 
    TrendingUp, 
    Users, 
    Wallet, 
    Calendar,
    ChevronRight,
    Megaphone,
    AlertCircle,
    Info,
    Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import PartnerStatsChart from "@/components/account/PartnerStatsChart";
import PartnerTagEditor from "@/components/account/PartnerTagEditor";
import CopyButton from "@/components/ui/CopyButton";

/**
 * Premium Partner Dashboard
 * Exclusively for approved content creators and partners.
 */
export default async function PartnerDashboardPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale).catch(() => null);
    if (!dict) return null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login?returnTo=/account/partner");

    // 1. Fetch Partner Profile
    const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // SECURITY: Only allow approved partners
    if (!profile?.is_partner) {
        redirect(`/${lang}/account`);
    }

    // 2. Fetch Performance Metrics (Clicks vs Commissions)
    // We fetch last 30 days of data for the chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: clicks } = await (supabase as any)
        .from("referral_clicks")
        .select("created_at")
        .eq("referrer_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

    const { data: commissions } = await (supabase as any)
        .from("commissions")
        .select("*, orders(total_pence)")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

    // 3. Process Chart Data (Live Performance Grouping)
    const chartData = [
        { name: 'Week 1', clicks: 0, sales: 0 },
        { name: 'Week 2', clicks: 0, sales: 0 },
        { name: 'Week 3', clicks: 0, sales: 0 },
        { name: 'Week 4', clicks: 0, sales: 0 },
    ];

    const now = new Date();
    const getWeekIndex = (dateStr: string) => {
        const date = new Date(dateStr);
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) return 3; // Week 4 (Latest)
        if (diffDays < 14) return 2; // Week 3
        if (diffDays < 21) return 1; // Week 2
        return 0; // Week 1 (Oldest)
    };

    clicks?.forEach((c: any) => {
        const idx = getWeekIndex(c.created_at);
        if (idx >= 0) chartData[idx].clicks++;
    });

    commissions?.forEach((c: any) => {
        if (new Date(c.created_at) >= thirtyDaysAgo) {
            const idx = getWeekIndex(c.created_at);
            if (idx >= 0) chartData[idx].sales++;
        }
    });

    return (
        <div className="min-h-screen bg-black py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-16 border-b border-white/5 pb-10">
                    <Link 
                        href={`/${lang}/account`}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-brand-yellow mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        {(dict.account as any).backBtn || "Back to Vault"}
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-3 block">
                                Partner Intelligence
                            </span>
                            <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
                                Dashboard <span className="text-white/20">Alpha</span>
                            </h1>
                        </div>
                        
                        <div className="bg-[#050505] border border-white/5 p-4 rounded flex items-center gap-4">
                            <div className="p-2.5 bg-brand-yellow/10 rounded-full">
                                <Megaphone className="w-4 h-4 text-brand-yellow" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-neutral-500 tracking-widest leading-none mb-1.5">Current Tag</p>
                                <PartnerTagEditor initialTag={profile.referral_code} lang={lang} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm relative overflow-hidden">
                        <TrendingUp className="absolute top-4 right-4 w-5 h-5 text-neutral-800" />
                        <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-2">Total Clicks</p>
                        <p className="text-3xl font-black text-white">{clicks?.length || 0}</p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm relative overflow-hidden">
                        <Users className="absolute top-4 right-4 w-5 h-5 text-neutral-800" />
                        <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-2">Conversions</p>
                        <p className="text-3xl font-black text-white">{commissions?.length || 0}</p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm relative overflow-hidden">
                        <Wallet className="absolute top-4 right-4 w-5 h-5 text-neutral-800" />
                        <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-2">Total Earned</p>
                        <p className="text-3xl font-black text-brand-yellow">{formatPrice(profile.total_paid_out_pence + profile.balance_pending_pence + profile.balance_withdrawable_pence)}</p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm relative overflow-hidden">
                        <Calendar className="absolute top-4 right-4 w-5 h-5 text-neutral-800" />
                        <p className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mb-2">Partner Since</p>
                        <p className="text-xl font-black text-white uppercase mt-1">
                            {new Date(profile.updated_at).toLocaleDateString(lang, { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Visualization Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-brand-yellow" />
                                    Growth Analytics
                                </h3>
                                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Last 30 Days</span>
                            </div>
                            <div className="h-[300px]">
                                <PartnerStatsChart data={chartData} />
                            </div>
                        </div>

                        {/* Commission Feed */}
                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8">Recent Activity</h3>
                            <div className="space-y-4">
                                {commissions && commissions.length > 0 ? (
                                    commissions.map((comm: any) => (
                                        <div key={comm.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-sm hover:border-brand-yellow/30 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center border font-black text-[10px] ${
                                                    comm.status === 'pending' ? 'bg-white/5 border-white/10 text-neutral-400' :
                                                    comm.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                    'bg-red-500/10 border-red-500/20 text-red-500'
                                                }`}>
                                                    {comm.status[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                                                        Commission #{comm.id.slice(0, 6)}
                                                    </p>
                                                    <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-tight">
                                                        {new Date(comm.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-brand-yellow tabular-nums">{formatPrice(comm.amount_pence)}</p>
                                                <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">{comm.status}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-neutral-600">
                                        <Info className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest italic leading-none">No active commission logs found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Toolkit */}
                    <div className="lg:col-span-1 space-y-10">
                        {/* Referral Toolkit */}
                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Influence Link</h3>
                                <CopyButton text={`https://5ivearts.com/?ref=${profile.referral_code}`} />
                            </div>
                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm mb-4">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <LinkIcon className="w-3 h-3 text-brand-yellow flex-shrink-0" />
                                    <code className="text-[10px] text-white/70 font-mono truncate">
                                        5ivearts.com/?ref={profile.referral_code}
                                    </code>
                                </div>
                            </div>
                            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-tight leading-relaxed italic">
                                Share this signature link with your community to earn 10-20% commissions on every referred acquisition.
                            </p>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Partner Wallet</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Withdrawable</p>
                                    <p className="text-4xl font-black text-brand-yellow tabular-nums">{formatPrice(profile.balance_withdrawable_pence)}</p>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <button disabled className="w-full bg-white/5 border border-white/10 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-center gap-2 cursor-not-allowed">
                                        Request Payout
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                    <p className="text-[8px] text-neutral-700 font-bold uppercase tracking-tighter text-center mt-3 italic">Next disbursement: 1st of month</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-yellow/5 border border-brand-yellow/20 p-8 rounded-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="w-4 h-4 text-brand-yellow" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">Protocol Alpha</h3>
                            </div>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight leading-relaxed">
                                Commissions are held in 'Pending' for 30 days to account for potential refunds. Once cleared, they automatically shift to your withdrawable vault.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
