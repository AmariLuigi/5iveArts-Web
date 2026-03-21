"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck, UserPlus, LogIn, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AccessTerminalPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
            </div>
        }>
            <TerminalForm />
        </Suspense>
    );
}

function TerminalForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo") || "/account";
    
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const supabase = createClient();

    async function handleAuth(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === "login") {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (loginError) throw loginError;
            } else {
                const { error: signupError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signupError) throw signupError;
                setError("Confirmation email sent. Please check your inbox to activate your terminal.");
                setLoading(false);
                return;
            }

            router.push(returnTo);
            router.refresh();
        } catch (err: any) {
            let msg = err.message;
            if (msg.includes("Invalid login")) {
                msg = "Access Denied. Ensure your security key is correct and your identity link is verified.";
            }
            setError(msg);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden py-20">
            {/* Background Decor (Matching Admin) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-yellow/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-brand-yellow/5 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <span className="text-[11px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-3 block">
                        Identity Verification
                    </span>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic">
                        Access Terminal
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Secure portal for 5iveArts Collectors
                    </p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm shadow-2xl relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute inset-x-0 h-px top-0 bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
                    
                    {/* Mode Toggle */}
                    <div className="flex border-b border-white/5 mb-8">
                        <button 
                            onClick={() => setMode("login")}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                                mode === "login" ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-neutral-600 hover:text-neutral-400"
                            }`}
                        >
                            Log In
                        </button>
                        <button 
                            onClick={() => setMode("signup")}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                                mode === "signup" ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-neutral-600 hover:text-neutral-400"
                            }`}
                        >
                             Register
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {error && (
                            <div className={`${error.includes("Confirmation") ? "bg-brand-yellow/10 border-brand-yellow/20 text-brand-yellow" : "bg-red-500/10 border-red-500/20 text-red-500"} border p-4 rounded-sm flex items-start gap-3`}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold uppercase tracking-tight">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-neutral-600 block ml-1">
                                Neural Link (Email)
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-brand-yellow transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/50 transition-all uppercase tracking-widest placeholder:text-[10px]"
                                    placeholder="COLLECTOR@5IVEARTS.COM"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-neutral-600 block ml-1">
                                Security Key (Password)
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-brand-yellow transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-12 text-sm font-medium text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/50 transition-all uppercase tracking-widest placeholder:text-[10px]"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full hasbro-btn-primary py-5 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                            ) : (
                                <>
                                    {mode === "login" ? "Verify Session" : "Establish Link"}
                                    {mode === "login" ? <LogIn className="w-4 h-4 text-black" /> : <UserPlus className="w-4 h-4 text-black" />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                             <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
                             <span className="text-[9px] font-black uppercase text-neutral-500 tracking-[0.2em]">End-to-End Encrypted Tunnel</span>
                        </div>
                        <p className="text-[9px] text-neutral-700 uppercase font-black tracking-widest text-center">
                            By accessing the terminal, you agree to our <Link href="/terms" className="text-neutral-500 hover:text-brand-yellow">Protocol Guidelines</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                   <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-all flex items-center justify-center gap-2 group">
                        <span className="w-4 h-px bg-neutral-800 group-hover:bg-neutral-600 transition-colors" />
                        Back to Public HQ
                        <span className="w-4 h-px bg-neutral-800 group-hover:bg-neutral-600 transition-colors" />
                   </Link>
                </div>
            </div>
        </div>
    );
}
