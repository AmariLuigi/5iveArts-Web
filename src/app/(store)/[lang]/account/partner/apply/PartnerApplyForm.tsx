'use client'

import React, { useState } from 'react';
import { submitPartnerApplication } from "@/app/actions/partner_application";
import { 
    Globe, 
    Send, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Users
} from 'lucide-react';
import { InstagramIcon, TwitterIcon, YoutubeIcon } from '@/components/ui/BrandIcons';

/**
 * High-Fidelity Form for Partner Candidacy.
 */
export default function PartnerApplyForm({ lang, userEmail, dict }: { lang: string, userEmail: string, dict: any }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullName: "",
        email: userEmail,
        website: "",
        bio: "",
        reachEstimate: "1k-10k",
        social: {
            instagram: "",
            tiktok: "",
            youtube: "",
            twitter: ""
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { success, error } = await submitPartnerApplication({
            fullName: formData.fullName,
            email: formData.email,
            socialMedia: formData.social,
            website: formData.website,
            bio: formData.bio,
            reachEstimate: formData.reachEstimate
        });

        if (success) {
            setSuccess(true);
        } else {
            setError(error || "Submission failed.");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-[#050505] border border-white/5 p-12 text-center rounded-sm animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-6 h-6 text-brand-yellow" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">{dict.community?.successTitle || "Protocol Initiated"}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-6">{dict.account.candidacyReview}</p>
                <div className="p-6 bg-white/5 border border-white/10 rounded-sm inline-block">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight leading-relaxed max-w-xs">
                        {dict.account.evaluationDesc}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10 bg-[#0a0a0a] border border-white/5 p-8 md:p-12 rounded-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl -mr-10 -mt-10" />
            
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">{error}</p>
                </div>
            )}

            {/* Basic Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-1">{dict.account.identityName}</label>
                    <input
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        placeholder={dict.account.authenticName}
                        className="w-full bg-black border border-white/10 rounded-sm px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-1">{dict.account.vaultEmail}</label>
                    <input
                        disabled
                        value={formData.email}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-sm px-4 py-3 text-[11px] font-black uppercase tracking-widest text-neutral-700 cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Bio & Website */}
            <div className="space-y-8">
                <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-1 flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        {dict.account.portfolioWebsite}
                    </label>
                    <input
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-black border border-white/10 rounded-sm px-4 py-3 text-[11px] font-black uppercase tracking-widest text-brand-yellow/70 focus:outline-none focus:border-brand-yellow/50 transition-all font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-1">{dict.account.creatorBio}</label>
                    <textarea
                        required
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder={dict.account.bioPlaceholder}
                        className="w-full bg-black border border-white/10 rounded-sm px-4 py-4 text-[10px] font-bold uppercase tracking-tight text-white focus:outline-none focus:border-brand-yellow/50 transition-all min-h-[120px] resize-none"
                    />
                </div>
            </div>

            {/* Social Influence */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-1.5 bg-brand-yellow/10 rounded-full">
                        <Users className="w-3.5 h-3.5 text-brand-yellow" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-white tracking-[0.2em]">{dict.account.socialProtocol}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative group">
                        <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                        <input
                            value={formData.social.instagram}
                            onChange={(e) => setFormData({...formData, social: {...formData.social, instagram: e.target.value}})}
                            placeholder="INSTAGRAM @HANDLE"
                            className="w-full bg-black border border-white/5 rounded-sm pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/40 transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <TwitterIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                        <input
                            value={formData.social.twitter}
                            onChange={(e) => setFormData({...formData, social: {...formData.social, twitter: e.target.value}})}
                            placeholder="TWITTER/X @HANDLE"
                            className="w-full bg-black border border-white/5 rounded-sm pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/40 transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <YoutubeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-brand-yellow transition-colors" />
                        <input
                            value={formData.social.youtube}
                            onChange={(e) => setFormData({...formData, social: {...formData.social, youtube: e.target.value}})}
                            placeholder="YOUTUBE CHANNEL"
                            className="w-full bg-black border border-white/5 rounded-sm pl-11 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/40 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <select
                            value={formData.reachEstimate}
                            onChange={(e) => setFormData({...formData, reachEstimate: e.target.value})}
                            className="w-full bg-black border border-white/10 rounded-sm px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 focus:outline-none focus:border-brand-yellow/50 transition-all appearance-none cursor-pointer"
                        >
                            <option value="1k-10k">1k - 10k Followers</option>
                            <option value="10k-50k">10k - 50k Followers</option>
                            <option value="50k-100k">50k - 100k Followers</option>
                            <option value="100k+">100k+ Followers</option>
                        </select>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-yellow hover:bg-brand-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-sm text-[11px] font-black uppercase tracking-[0.4em] text-black transition-all flex items-center justify-center gap-3 overflow-hidden group"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        {dict.account.initiateCandidacy}
                    </>
                )}
            </button>

            <p className="text-[8px] text-neutral-700 font-bold uppercase tracking-widest text-center mt-6 italic">
                By submitting, you agree to our Partnership Protocol & Attribution Rules.
            </p>
        </form>
    );
}
