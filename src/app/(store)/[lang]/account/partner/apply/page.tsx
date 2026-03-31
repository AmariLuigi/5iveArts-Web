import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { ArrowLeft, Send, Instagram, Twitter, Youtube, Globe, Info, Search } from "lucide-react";
import Link from "next/link";
import PartnerApplyForm from "./PartnerApplyForm";

/**
 * Museum-Grade Partner Application Portal.
 * Exclusively for verified collectors to apply for the Fellowship.
 */
export default async function PartnerApplyPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale).catch(() => null);
    if (!dict) return null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login?returnTo=/account/partner/apply");

    // 1. Check if user is already a partner
    const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("is_partner")
        .eq("id", user.id)
        .single();
    
    if (profile?.is_partner) {
        redirect(`/${lang}/account/partner`);
    }

    // 2. Check for existing application
    const { data: existingApp } = await (supabase as any)
        .from("partner_applications")
        .select("status, created_at")
        .eq("user_id", user.id)
        .single();

    return (
        <div className="min-h-screen bg-black py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Link 
                    href={`/${lang}/account`}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-brand-yellow mb-12 transition-all group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Vault
                </Link>

                <div className="mb-16">
                    <span className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-4 block animate-pulse">
                        Protocol: FELLOWSHIP CANDIDACY
                    </span>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white mb-6">
                        Apply to <span className="text-white/20">The 5ive</span> Arts
                    </h1>
                    <p className="text-neutral-500 font-bold text-sm uppercase tracking-tight leading-relaxed max-w-xl">
                        Become a verified partner in our ecosystem. Showcase your influence, earn 10-20% commissions, and gain exclusive access to museum-grade collectibles before public release.
                    </p>
                </div>

                {existingApp ? (
                    <div className="bg-[#050505] border border-white/5 p-12 text-center rounded-sm">
                        <div className="w-16 h-16 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_-20px_var(--hasbro-yellow)]">
                            <Send className="w-6 h-6 text-brand-yellow animate-bounce" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Candidacy Under Review</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-6 italic">
                            Submitted on {new Date(existingApp.created_at).toLocaleDateString()}
                        </p>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-sm max-w-sm mx-auto">
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight leading-relaxed underline underline-offset-4 decoration-brand-yellow/40">
                                Your application is being evaluated by its reach and artistic alignment. Expect clearance via email within 48-72 hours.
                            </p>
                        </div>
                    </div>
                ) : (
                    <PartnerApplyForm lang={lang} userEmail={user.email || ""} />
                )}

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 border-t border-white/5 opacity-50 grayscale hover:grayscale-0 transition-all">
                    <div className="space-y-3">
                        <Instagram className="w-5 h-5 text-neutral-600" />
                        <p className="text-[9px] font-black uppercase text-white tracking-widest">Global Reach</p>
                        <p className="text-[10px] font-bold text-neutral-600 leading-relaxed uppercase">
                            Connect your community to premium dioramas and figures.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Youtube className="w-5 h-5 text-neutral-600" />
                        <p className="text-[9px] font-black uppercase text-white tracking-widest">Partner Commissions</p>
                        <p className="text-[10px] font-bold text-neutral-600 leading-relaxed uppercase">
                            Earn significant rewards for every referred acquisition.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <ShieldCheck className="w-5 h-5 text-neutral-600" />
                        <p className="text-[9px] font-black uppercase text-white tracking-widest">Protocol Protected</p>
                        <p className="text-[10px] font-bold text-neutral-600 leading-relaxed uppercase">
                            Secure, real-time ledgers tracking every influence click.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Inline Icon Import Helper (Already in layout context)
function ShieldCheck({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>;
}
