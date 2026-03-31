"use client";

import { useState } from "react";
import { updatePartnerTag } from "@/app/actions/partner_tag";
import { Edit3, Check, X, Loader2 } from "lucide-react";

/**
 * High-Fidelity Inline Editor for Partner Referral Tags.
 */
export default function PartnerTagEditor({ initialTag, lang }: { initialTag: string, lang: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tag, setTag] = useState(initialTag);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (tag === initialTag) return setIsEditing(false);
        setLoading(true);
        setError(null);
        
        const result = await updatePartnerTag(tag);
        
        if (result.success) {
            setIsEditing(false);
            setLoading(false);
        } else {
            setError(result.error || "Update protocol failed.");
            setLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <input 
                        value={tag}
                        onChange={(e) => setTag(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="bg-black border border-brand-yellow/30 text-[10px] font-black uppercase tracking-widest text-brand-yellow px-3 py-1.5 rounded-sm focus:outline-none focus:border-brand-yellow w-40"
                        autoFocus
                    />
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="p-1.5 bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/20 transition-all rounded-sm"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button 
                        onClick={() => { setIsEditing(false); setTag(initialTag); setError(null); }}
                        className="p-1.5 bg-white/5 border border-white/10 text-neutral-500 hover:text-white transition-all rounded-sm"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
                {error && <p className="text-[8px] font-black uppercase text-red-500 tracking-widest">{error}</p>}
            </div>
        );
    }

    return (
        <div className="group flex items-center gap-3">
            <span className="text-xl font-black uppercase tracking-widest text-white">{tag}</span>
            <button 
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/5 border border-white/10 text-neutral-500 hover:text-white transition-all rounded-sm"
            >
                <Edit3 className="w-3 h-3" />
            </button>
        </div>
    );
}
