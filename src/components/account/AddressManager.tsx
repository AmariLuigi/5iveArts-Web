"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, CheckCircle2, Loader2, X, Home, Phone, Map as MapIcon } from "lucide-react";
import { UserAddress } from "@/types";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface AddressManagerProps {
    lang: string;
    dict: any;
    userEmail?: string;
}

export default function AddressManager({ lang, dict, userEmail }: AddressManagerProps) {
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        full_name: "",
        email: userEmail || "",
        street1: "",
        street2: "",
        city: "",
        state: "",
        zip_code: "",
        country: "IT",
        phone: "",
        is_default: false
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await axios.get("/api/account/addresses");
            setAddresses(res.data);
        } catch (err) {
            console.error("Failed to fetch addresses:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await axios.patch(`/api/account/addresses/${editingId}`, formData);
            } else {
                await axios.post("/api/account/addresses", formData);
            }
            await fetchAddresses();
            setIsAdding(false);
            setEditingId(null);
            resetForm();
        } catch (err) {
            console.error("Failed to save address:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(dict.account.settings.confirmDelete)) return;
        try {
            await axios.delete(`/api/account/addresses/${id}`);
            setAddresses(addresses.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to delete address:", err);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await axios.patch(`/api/account/addresses/${id}/default`);
            await fetchAddresses();
        } catch (err) {
            console.error("Failed to set default:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: "",
            email: userEmail || "",
            street1: "",
            street2: "",
            city: "",
            state: "",
            zip_code: "",
            country: "IT",
            phone: "",
            is_default: false
        });
    };

    const startEdit = (address: UserAddress) => {
        setFormData({
            full_name: address.full_name,
            email: address.email || userEmail || "",
            street1: address.street1,
            street2: address.street2 || "",
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            country: address.country,
            phone: address.phone || "",
            is_default: address.is_default
        });
        setEditingId(address.id);
        setIsAdding(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-brand-yellow" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white">
                        {dict.account.settings.addresses}
                    </h2>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => {
                            resetForm();
                            setIsAdding(true);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-brand-yellow flex items-center gap-2 hover:text-white transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {dict.account.settings.addAddress}
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {isAdding ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[#0a0a0a] border border-brand-yellow/30 p-8 rounded-sm relative"
                    >
                        <button 
                            onClick={() => { setIsAdding(false); setEditingId(null); }}
                            className="absolute top-6 right-6 text-neutral-600 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-yellow mb-8">
                                {editingId ? dict.account.settings.edit : dict.account.settings.addAddress}
                            </h3>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Full Name</label>
                                    <input
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Contact Email</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                        placeholder="curator@5ivearts.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Phone (Optional)</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Country Code (ISO)</label>
                                    <input
                                        required
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                        maxLength={2}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Street Address</label>
                                <input
                                    required
                                    value={formData.street1}
                                    onChange={e => setFormData({ ...formData, street1: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">City</label>
                                    <input
                                        required
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">State / Province</label>
                                    <input
                                        required
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] uppercase font-black tracking-widest text-neutral-600">Zip / Postcode</label>
                                    <input
                                        required
                                        value={formData.zip_code}
                                        onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-[11px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full hasbro-btn-primary py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all"
                            >
                                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                {editingId ? dict.account.settings.edit : dict.account.settings.addAddress}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {addresses.length === 0 ? (
                            <div className="bg-[#0a0a0a] border border-white/5 p-12 text-center rounded-sm">
                                <Home className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
                                <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500">
                                    {dict.account.settings.noAddresses}
                                </p>
                            </div>
                        ) : (
                            addresses.map((address) => (
                                <div 
                                    key={address.id}
                                    className={`bg-[#0a0a0a] border ${address.is_default ? 'border-brand-yellow/30' : 'border-white/5'} p-6 rounded-sm group relative hover:border-white/20 transition-all`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-white">
                                                    {address.full_name}
                                                </span>
                                                {address.is_default && (
                                                    <span className="text-[8px] bg-brand-yellow text-black px-2 py-0.5 font-black uppercase tracking-widest rounded-sm">
                                                        {dict.account.settings.default}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                                {address.street1}{address.street2 ? `, ${address.street2}` : ''}<br />
                                                {address.zip_code} {address.city}, {address.state}<br />
                                                {address.country}
                                            </p>
                                            {address.phone && (
                                                <div className="flex items-center gap-2 text-[9px] text-neutral-600 uppercase font-black tracking-widest">
                                                    <Phone className="w-3 h-3" />
                                                    {address.phone}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(address)}
                                                    className="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                                                >
                                                    {dict.account.settings.edit}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(address.id)}
                                                    className="text-[9px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
                                                >
                                                    {dict.account.settings.delete}
                                                </button>
                                            </div>
                                            {!address.is_default && (
                                                <button
                                                    onClick={() => handleSetDefault(address.id)}
                                                    className="text-[8px] font-black uppercase tracking-widest text-brand-yellow/50 hover:text-brand-yellow transition-colors mt-2"
                                                >
                                                    {dict.account.settings.setDefault}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
