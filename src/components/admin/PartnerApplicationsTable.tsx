'use client'

import React, { useState } from 'react';
import { approvePartnerApplication } from "@/app/actions/partner_application";
import { 
    Check, 
    X, 
    Instagram, 
    Twitter, 
    Youtube, 
    Globe, 
    ExternalLink, 
    ShieldCheck, 
    Loader2,
    Calendar,
    Users,
    Mail
} from 'lucide-react';

/**
 * Admin Table for Partner Candidacy Management.
 */
export default function PartnerApplicationsTable({ initialData }: { initialData: any[] }) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [applications, setApplications] = useState(initialData);

    const handleApprove = async (appId: string, userId: string) => {
        if (!confirm("Confirm entry into Fellowship Protocol?")) return;
        
        setUpdating(appId);
        const { success, error } = await approvePartnerApplication(appId, userId);
        
        if (success) {
            setApplications(prev => prev.filter(app => app.id !== appId));
        } else {
            alert(error || "Authorization failed.");
        }
        setUpdating(null);
    };

    if (applications.length === 0) {
        return (
            <div className="bg-[#0a0a0a] border border-white/5 p-20 text-center rounded">
                <Users className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]">No Pending Candidacies in Vault</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-x-auto shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Candidate Identity</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Social Protocol</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Reach Est.</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Bio / Intent</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Operations</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-white/[0.01] transition-all group">
                            {/* Candidate Identity */}
                            <td className="px-6 py-5">
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{app.full_name}</p>
                                    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-tight flex items-center gap-1">
                                        <Mail className="w-3 h-3 opacity-30" />
                                        {app.email}
                                    </p>
                                    <p className="text-[8px] font-bold text-neutral-700 uppercase mt-1 italic tabular-nums">
                                        Applied {new Date(app.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </td>

                            {/* Social Protocol */}
                            <td className="px-6 py-5">
                                <div className="flex flex-wrap gap-3">
                                    {app.social_media.instagram && (
                                        <div className="flex items-center gap-1.5 p-1 px-2 bg-white/[0.02] border border-white/5 rounded-sm">
                                            <Instagram className="w-3 h-3 text-pink-500" />
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{app.social_media.instagram}</span>
                                        </div>
                                    )}
                                    {app.social_media.youtube && (
                                        <div className="flex items-center gap-1.5 p-1 px-2 bg-white/[0.02] border border-white/5 rounded-sm">
                                            <Youtube className="w-3 h-3 text-red-500" />
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{app.social_media.youtube}</span>
                                        </div>
                                    )}
                                    {app.website && (
                                        <a href={app.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-1 px-2 bg-brand-yellow/5 border border-brand-yellow/10 rounded-sm hover:bg-brand-yellow/10 transition-colors">
                                            <Globe className="w-3 h-3 text-brand-yellow" />
                                            <ExternalLink className="w-3 h-3 text-brand-yellow/40" />
                                        </a>
                                    )}
                                </div>
                            </td>

                            {/* Reach */}
                            <td className="px-6 py-5 text-center">
                                <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest tabular-nums">
                                    {app.reach_estimate || "Unknown"}
                                </span>
                            </td>

                            {/* Bio */}
                            <td className="px-6 py-5 max-w-[300px]">
                                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight line-clamp-2 italic leading-relaxed">
                                    "{app.bio}"
                                </p>
                            </td>

                            {/* Operations */}
                            <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-4">
                                    <button 
                                        className="p-2 hover:bg-red-500/10 rounded-sm transition-colors text-neutral-700 hover:text-red-500"
                                        title="Reject Candidacy"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleApprove(app.id, app.user_id)}
                                        disabled={updating === app.id}
                                        className="px-6 py-2 bg-brand-yellow text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-sm hover:bg-brand-yellow/90 transition-all flex items-center gap-2 shadow-[0_0_20px_-10px_var(--hasbro-yellow)]"
                                    >
                                        {updating === app.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Authorize
                                            </>
                                        )}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
