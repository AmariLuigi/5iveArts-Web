"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck, UserPlus, LogIn, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import OneTapComponent from "@/components/auth/OneTapComponent";


export default function TerminalForm({ dict, lang }: { dict: any, lang: string }) {
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

    async function handleGoogleLogin() {
        setLoading(true);
        setError(null);
        try {
            if (typeof (window as any).triggerGoogleAuth === 'function') {
                console.log('[auth/client] Triggering high-fidelity identity protocol...');
                (window as any).triggerGoogleAuth();
                
                // Keep loading state until potential redirect or callback
                setTimeout(() => setLoading(false), 3000);
            } else {
                // If the script isn't and ready, fallback but warn
                console.warn('[auth/client] Google Identity script not yet available.');
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback?next=/${lang}${returnTo.startsWith('/') ? returnTo : `/${returnTo}`}`,
                    }
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

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
                setError(dict.errors?.confirmationSent || "Confirmation email sent. Please check your inbox to activate your terminal.");
                setLoading(false);
                return;
            }

            // Route to localized account page
            router.push(`/${lang}${returnTo.startsWith('/') ? returnTo : `/${returnTo}`}`);
            router.refresh();
        } catch (err: any) {
            let msg = err.message;
            if (msg.includes("Invalid login")) {
                msg = dict.errors?.invalidLogin || "Access Denied. Ensure your security key is correct and your identity link is verified.";
            }
            setError(msg);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden py-20">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-yellow/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-brand-yellow/5 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <span className="text-[11px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-3 block">
                        {dict.auth.verification}
                    </span>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic">
                        {dict.auth.terminal}
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        {dict.auth.portal}
                    </p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-x-0 h-px top-0 bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
                    
                    <div className="flex border-b border-white/5 mb-8">
                        <button 
                            onClick={() => setMode("login")}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                                mode === "login" ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-neutral-600 hover:text-neutral-400"
                            }`}
                        >
                            {dict.auth.login}
                        </button>
                        <button 
                            onClick={() => setMode("signup")}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                                mode === "signup" ? "text-brand-yellow border-b-2 border-brand-yellow" : "text-neutral-600 hover:text-neutral-400"
                            }`}
                        >
                             {dict.auth.register}
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {error && (
                            <div className={`${(error.includes("Confirmation") || error.includes("inviata") || error.includes("enviado") || error.includes("envoyé") || error.includes("gesendet")) 
                                ? "bg-green-500/10 border-green-500/20 text-green-500" 
                                : "bg-red-500/10 border-red-500/20 text-red-500"} border p-4 rounded-sm flex items-start gap-3`}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold uppercase tracking-tight">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-neutral-600 block ml-1">
                                {dict.auth.emailLabel}
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-brand-yellow transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/50 transition-all uppercase tracking-widest placeholder:text-[10px]"
                                    placeholder={dict.auth.emailPlaceholder || "COLLECTOR@5IVEARTS.COM"}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black tracking-widest text-neutral-600 block ml-1">
                                {dict.auth.passwordLabel}
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
                                    {mode === "login" ? dict.auth.verifyBtn : dict.auth.registerBtn}
                                    {mode === "login" ? <LogIn className="w-4 h-4 text-black" /> : <UserPlus className="w-4 h-4 text-black" />}
                                </>
                            )}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]">
                                <span className="bg-[#0a0a0a] px-4 text-neutral-600">{dict.auth.or || "OR"}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white/[0.03] border border-white/10 py-5 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/[0.06] hover:border-white/20 transition-all group"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            {dict.auth.googleLogin || "Continue with Google"}
                        </button>
                    </form>

                    <OneTapComponent />

                    <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                             <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
                             <span className="text-[9px] font-black uppercase text-neutral-500 tracking-[0.2em]">{dict.auth.tunnel}</span>
                        </div>
                        <p className="text-[9px] text-neutral-700 uppercase font-black tracking-widest text-center">
                            {dict.auth.guidelines}
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                   <Link href={`/${lang}`} className="text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-all flex items-center justify-center gap-2 group">
                        <span className="w-4 h-px bg-neutral-800 group-hover:bg-neutral-600 transition-colors" />
                        {dict.auth.backHome}
                        <span className="w-4 h-px bg-neutral-800 group-hover:bg-neutral-600 transition-colors" />
                   </Link>
                </div>
            </div>
        </div>
    );
}
