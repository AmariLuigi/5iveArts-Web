import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ShieldCheck, Mail, Send, AlertTriangle } from "lucide-react";

export default async function SettingsPage() {
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
                        Vault Security
                    </h1>
                    <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold">
                        Manage your collector identity and access protocols.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Verification Status */}
                    <div id="verification" className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className={`w-5 h-5 ${isConfirmed ? 'text-green-500' : 'text-orange-500'}`} />
                                <h2 className="text-xs font-black uppercase tracking-widest text-white">Identity Verification</h2>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                isConfirmed ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                            }`}>
                                {isConfirmed ? 'Verified' : 'Pending Verification'}
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
                                        Your access is currently in a "Guest-Protected" state. Some fulfillment logs and administrative updates require a verified identity link.
                                    </p>
                                </div>
                                
                                <form action="/api/auth/resend-verification" method="POST">
                                    <button 
                                        type="submit"
                                        className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-500 border border-orange-500/20 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Request New Verification Link
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
