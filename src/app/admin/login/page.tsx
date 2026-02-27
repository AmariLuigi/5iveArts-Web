"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(searchParams.get("error") === "unauthorized" ? "Unauthorized access. This area is for the site administrator only." : null);

    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            setError(loginError.message);
            setLoading(false);
            return;
        }

        router.push("/admin");
        router.refresh();
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-yellow/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-brand-yellow/5 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-md z-10">
                {/* Logo/Brand Header */}
                <div className="text-center mb-10">
                    <span className="text-[11px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-3 block">
                        Secure Access
                    </span>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
                        5iveArts Admin
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Collector Series Management Portal
                    </p>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm shadow-2xl backdrop-blur-md relative">
                    <div className="absolute inset-x-0 h-px top-0 bg-gradient-to-r from-transparent via-brand-yellow/20 to-transparent" />

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs font-bold uppercase tracking-tight text-red-400">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-[10px] uppercase font-black tracking-widest text-white/40 block ml-1"
                            >
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-brand-yellow/50 transition-all"
                                    placeholder="admin@5ivearts.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-[10px] uppercase font-black tracking-widest text-white/40 block ml-1"
                            >
                                Security Key
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-brand-yellow/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full hasbro-btn-primary py-5 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                            ) : (
                                <>
                                    Access Terminal
                                    <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-black" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase text-neutral-600 tracking-widest">Database</span>
                            <span className="text-[10px] font-bold uppercase text-brand-yellow">Live Connected</span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-[10px] font-black uppercase text-neutral-600 tracking-widest">Encryption</span>
                            <span className="text-[10px] font-bold uppercase text-brand-yellow">AES-256 Valid</span>
                        </div>
                    </div>
                </div>

                <p className="mt-10 text-center text-[10px] uppercase font-black tracking-widest text-neutral-700">
                    Authorized personnel only. Sessions are logged periodically.
                </p>
            </div>
        </div>
    );
}
