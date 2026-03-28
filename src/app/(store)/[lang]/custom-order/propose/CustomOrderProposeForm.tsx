"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Box, 
  Paintbrush, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X,
  Sparkles,
  Search
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { createClient } from "@/lib/supabase-browser";

interface CustomOrderProposeFormProps {
  dict: any;
  lang: string;
}

const SCALES = ["1:12", "1:10", "1:6", "1:4", "Other"];
const FINISHES = ["Raw (Grey Resin)", "Painted (Standard)", "Painted (Master Grade)"];

export default function CustomOrderProposeForm({ dict, lang }: CustomOrderProposeFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scale, setScale] = useState(SCALES[0]);
  const [finish, setFinish] = useState(FINISHES[1]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 3) {
      setError("Maximum 3 reference images allowed");
      return;
    }
    
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || files.length === 0) {
      setError("Please complete all required fields and upload at least one image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User authentication required");

      // 1. Upload Images
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('order-progress')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('order-progress')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }

      // 2. Create Custom Order
      const res = await axios.post("/api/orders/custom", {
        title,
        description,
        scale,
        finish,
        imageUrls: uploadedUrls
      });

      if (res.status === 201) {
        setStep(4); // Success step
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-16 relative">
         <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
         {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-black transition-all duration-500 bg-black ${
                step >= s ? 'border-brand-yellow text-brand-yellow shadow-[0_0_15px_#ff9f0033]' : 'border-white/10 text-neutral-700'
              }`}
            >
               {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" variants={container} initial="hidden" animate="show" exit="exit" className="space-y-10">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">Artisan Bureau</span>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">Project Identity</h1>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Character / Project Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Chief - Mark VI"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-5 text-sm font-black uppercase tracking-widest text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Desired Scale</label>
                    <select 
                      value={scale}
                      onChange={(e) => setScale(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-5 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/30"
                    >
                      {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Finish Protocol</label>
                    <select 
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-5 text-sm font-black uppercase tracking-widest text-white focus:outline-none focus:border-brand-yellow/30"
                    >
                      {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!title}
              className="hasbro-btn-primary w-full py-5 text-xs font-black disabled:opacity-50"
            >
              Configure Details
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" variants={container} initial="hidden" animate="show" exit="exit" className="space-y-10">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">Bureau Documentation</span>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">Narrative Scope</h1>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">Project Description</label>
                <textarea 
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your vision, specific poses, or reference details..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-5 text-sm font-bold uppercase tracking-widest text-white placeholder:text-neutral-800 focus:outline-none focus:border-brand-yellow/30 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-8 py-5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-all">
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!description}
                className="hasbro-btn-primary flex-1 py-5 text-xs font-black disabled:opacity-50"
              >
                Upload Assets
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" variants={container} initial="hidden" animate="show" exit="exit" className="space-y-10">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">Visual Evidence</span>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">Asset Transmission</h1>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-square relative group rounded border border-white/10 overflow-hidden">
                    <img src={src} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {files.length < 3 && (
                  <label className="aspect-square border-2 border-dashed border-white/5 rounded flex flex-col items-center justify-center cursor-pointer hover:border-brand-yellow/20 hover:bg-white/[0.01] transition-all group">
                    <Upload className="w-6 h-6 text-neutral-700 group-hover:text-brand-yellow transition-colors mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-800 group-hover:text-neutral-500">Add File</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                  </label>
                )}
              </div>
              
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-600 text-center">
                Supported formats: JPG, PNG, WEBP (MAX 3)
              </p>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(2)} 
                disabled={loading}
                className="px-8 py-5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading || files.length === 0}
                className="hasbro-btn-primary flex-1 py-5 text-xs font-black disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4 text-black/50" />}
                Submit Commission
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="text-center py-20 space-y-12"
          >
            <div className="w-24 h-24 bg-brand-yellow/10 rounded-full border border-brand-yellow/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,159,0,0.1)]">
               <CheckCircle2 className="w-10 h-10 text-brand-yellow" />
            </div>
            
            <div className="space-y-4">
               <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic">Protocol Initialized</h1>
               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500">Transmission Complete</p>
            </div>

            <p className="text-sm font-bold uppercase tracking-widest text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Your documentation has been encrypted and submitted to our lead curators. We will review the feasibility and complexity within 24-48 hours.
            </p>

            <button 
              onClick={() => router.push(`/${lang}/account`)}
              className="hasbro-btn-primary px-12 py-5 text-xs font-black"
            >
              Enter My Vault
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
