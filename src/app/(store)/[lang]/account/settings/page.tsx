import { getDictionary, Locale } from "@/lib/get-dictionary";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ShieldCheck, Mail, Send, AlertTriangle, MapPin } from "lucide-react";
import AddressManager from "@/components/account/AddressManager";

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale).catch(() => null);

    if (!dict) notFound();

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const isConfirmed = !!user.email_confirmed_at;

    return (
        <div className="min-h-screen bg-black py-20 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
                        {dict.account.settings.title}
                    </h1>
                    <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold">
                        {dict.account.settings.subtitle}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Verification Status */}
                    <div id="verification" className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className={`w-5 h-5 ${isConfirmed ? 'text-green-500' : 'text-orange-500'}`} />
                                <h2 className="text-xs font-black uppercase tracking-widest text-white">{dict.account.settings.identityVerification}</h2>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                isConfirmed ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                            }`}>
                                {isConfirmed ? dict.account.settings.verified : dict.account.settings.pending}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-sm border border-white/5 mb-8">
                            <Mail className="w-4 h-4 text-neutral-600" />
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                {user.email}
                            </span>
                        </div>

                        {!isConfirmed && (
                            <div className="space-y-6">
                                <div className="flex items-start gap-3 text-orange-500 opacity-80">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                        {dict.account.settings.guestProtected}
                                    </p>
                                </div>
                                
                                <form action="/api/auth/resend-verification" method="POST">
                                    <button 
                                        type="submit"
                                        className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 border border-orange-500/20 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        {dict.account.settings.requestLink}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Dispatch Destinations */}
                    <div id="addresses" className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                        <AddressManager lang={lang} dict={dict} userEmail={user.email} />
                    </div>
                </div>
            </div>
        </div>
    );
}
