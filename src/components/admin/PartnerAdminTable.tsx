'use client'

import React, { useState } from 'react';
import { updatePartnerProtocol } from '@/app/actions/admin/partners';
import { formatPrice } from '@/lib/products';
import { 
    Check, 
    X, 
    Edit2, 
    Save, 
    ShieldAlert, 
    Loader2, 
    ExternalLink,
    Tag,
    Wallet
} from 'lucide-react';

/**
 * Interactive Admin Table for Partner Management.
 * Handles real-time status toggling and commission rate configuration.
 */
export default function PartnerAdminTable({ initialData }: { initialData: any[] }) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    const handleToggle = async (userId: string, currentStatus: boolean, rate: number) => {
        setUpdating(userId);
        const { error } = await updatePartnerProtocol(userId, !currentStatus, rate);
        if (error) alert(error);
        setUpdating(null);
    };

    const handleSaveRate = async (userId: string, isPartner: boolean) => {
        const rate = parseFloat(editValue);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            alert("Invalid rate (0-100)");
            return;
        }

        setUpdating(userId);
        const { error } = await updatePartnerProtocol(userId, isPartner, rate);
        if (error) alert(error);
        setEditing(null);
        setUpdating(null);
    };

    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-x-auto shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Collector Node</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Referral Tag</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Protocol Status</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Commission Tier</th>
                        <th className="px-6 py-4 text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Wallet Log</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black uppercase text-neutral-600 tracking-[0.2em]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {initialData.map((profile) => (
                        <tr key={profile.id} className="hover:bg-white/[0.01] transition-all group">
                            {/* Node Identity */}
                            <td className="px-6 py-5">
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{profile.email || "Unknown"}</p>
                                    <p className="text-[8px] font-bold text-neutral-600 uppercase mt-0.5 font-mono">{profile.id.slice(0, 13)}...</p>
                                </div>
                            </td>

                            {/* Referral Tag */}
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-neutral-600" />
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest font-mono">
                                        {profile.referral_code}
                                    </span>
                                </div>
                            </td>

                            {/* Status Toggle */}
                            <td className="px-6 py-5">
                                <button
                                    onClick={() => handleToggle(profile.id, profile.is_partner, profile.commission_rate)}
                                    disabled={updating === profile.id}
                                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${
                                        profile.is_partner 
                                            ? "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/30 shadow-[0_0_15px_-8px_var(--hasbro-yellow)]" 
                                            : "bg-white/5 text-neutral-600 border-white/10 hover:border-white/20"
                                    }`}
                                >
                                    {updating === profile.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : profile.is_partner ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <X className="w-3 h-3 text-neutral-700" />
                                    )}
                                    {profile.is_partner ? "Partner" : "Collector"}
                                </button>
                            </td>

                            {/* Commission Rate */}
                            <td className="px-6 py-5">
                                {editing === profile.id ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            step="0.5"
                                            className="w-16 bg-black border border-brand-yellow/40 rounded px-2 py-1 text-[10px] font-black text-brand-yellow focus:outline-none"
                                        />
                                        <button onClick={() => handleSaveRate(profile.id, profile.is_partner)}>
                                            <Save className="w-4 h-4 text-green-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-white tabular-nums">{profile.commission_rate}%</span>
                                        <button 
                                            onClick={() => {
                                                setEditing(profile.id);
                                                setEditValue(profile.commission_rate.toString());
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Edit2 className="w-3 h-3 text-neutral-600 hover:text-white" />
                                        </button>
                                    </div>
                                )}
                            </td>

                            {/* Balances */}
                            <td className="px-6 py-5">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-6 text-[8px] font-black tracking-widest text-neutral-600 uppercase">
                                        <span>Pend</span>
                                        <span className="text-white">{formatPrice(profile.balance_pending_pence)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-6 text-[8px] font-black tracking-widest text-neutral-600 uppercase">
                                        <span>Avail</span>
                                        <span className="text-brand-yellow">{formatPrice(profile.balance_withdrawable_pence)}</span>
                                    </div>
                                </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <button 
                                        className="p-2 hover:bg-white/5 rounded-sm transition-colors text-neutral-600 hover:text-white"
                                        title="Audit Commission History"
                                    >
                                        <Wallet className="w-4 h-4" />
                                    </button>
                                    <button 
                                        className="p-2 hover:bg-white/5 rounded-sm transition-colors text-neutral-600 hover:text-white"
                                        title="View Public Profile"
                                    >
                                        <ExternalLink className="w-4 h-4" />
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
