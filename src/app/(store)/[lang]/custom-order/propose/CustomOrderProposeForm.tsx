"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { createClient } from "@/lib/supabase-browser";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CustomOrderProposeFormProps {
  dict: any;
  lang: string;
}

const SESSION_KEY = "5ivearts-custom-order-draft";

export default function CustomOrderProposeForm({ dict, lang }: CustomOrderProposeFormProps) {
  const router = useRouter();
  const { track } = useAnalytics();
  const t = dict.custom_order;
  const stepEnteredAt = useRef<number>(Date.now());
  
  const scaleOptions = [
    { code: "1:12", name: t.scales["1:12"] },
    { code: "1:10", name: t.scales["1:10"] },
    { code: "1:6", name: t.scales["1:6"] },
    { code: "1:4", name: t.scales["1:4"] },
    { code: "Other", name: t.scales["other"] },
  ];

  const finishOptions = [
    { code: "Raw (Grey Resin)", name: t.finishes["raw"] },
    { code: "Painted (Standard)", name: t.finishes["standard"] },
    { code: "Painted (Master Grade)", name: t.finishes["master"] },
  ];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scale, setScale] = useState(scaleOptions[0].code);
  const [finish, setFinish] = useState(finishOptions[1].code);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Inline validation state
  const [titleTouched, setTitleTouched] = useState(false);
  const [descTouched, setDescTouched] = useState(false);
  const titleError = titleTouched && !title.trim() 
    ? "Project title is required" : 
    titleTouched && title.trim().length < 3 
    ? "Title must be at least 3 characters" : null;
  const descError = descTouched && !description.trim() 
    ? "Project description is required" : 
    descTouched && description.trim().length < 20 
    ? "Please provide more detail (20+ characters)" : null;
  
  const supabase = createClient();

  // ── Session Persistence ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.scale) setScale(parsed.scale);
        if (parsed.finish) setFinish(parsed.finish);
        if (parsed.step && parsed.step < 4) setStep(parsed.step);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (step >= 4) return; // Don't persist success state
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ title, description, scale, finish, step }));
    } catch {
      // ignore
    }
  }, [title, description, scale, finish, step]);

  // ── Analytics: Step Funnel ────────────────────────────────────────────────
  useEffect(() => {
    if (step > 3) return;
    const now = Date.now();
    const timeOnPrev = now - stepEnteredAt.current;
    stepEnteredAt.current = now;

    track(
      `custom_order_step_${step}` as "custom_order_step_1" | "custom_order_step_2" | "custom_order_step_3",
      {
        step,
        title_length: title.length,
        desc_length: description.length,
        ...(step > 1 ? { time_on_previous_step_ms: timeOnPrev } : {}),
      },
      step
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 3) {
      setError(t.error_max_files);
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

  const goToStep = (nextStep: number) => {
    // Validate before advancing
    if (nextStep === 2 && !title.trim()) {
      setTitleTouched(true);
      return;
    }
    if (nextStep === 3 && !description.trim()) {
      setDescTouched(true);
      return;
    }
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!title || !description || files.length === 0) {
      setError(t.error_required_fields);
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
        const { error: uploadError } = await supabase.storage
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
        // Track successful submission
        track("custom_order_submitted", {
          scale,
          finish,
          image_count: uploadedUrls.length,
          title_length: title.length,
          desc_length: description.length,
        });

        // Clear session draft on success
        sessionStorage.removeItem(SESSION_KEY);
        setStep(4);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Something went wrong. Please try again.";
      setError(errorMessage);
      
      track("custom_order_error", {
        error: errorMessage,
        step,
        image_count: files.length,
      });
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
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
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">{t.proposal_step_identity_tag}</span>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">{t.proposal_step_identity_title}</h1>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">{t.proposal_field_title_label}</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); if (titleTouched) setTitleTouched(true); }}
                  onBlur={() => setTitleTouched(true)}
                  placeholder={t.proposal_field_title_placeholder}
                  className={`w-full bg-white/[0.02] border rounded-sm p-5 text-sm font-black uppercase tracking-widest text-white placeholder:text-neutral-800 focus:outline-none transition-all font-outfit ${
                    titleError ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-brand-yellow/30"
                  }`}
                />
                {titleError && (
                  <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {titleError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <CustomSelect 
                    label={t.proposal_field_scale_label}
                    options={scaleOptions}
                    value={scale}
                    onChange={setScale}
                 />
                 <CustomSelect 
                    label={t.proposal_field_finish_label}
                    options={finishOptions}
                    value={finish}
                    onChange={setFinish}
                 />
              </div>
            </div>

            <button 
              onClick={() => goToStep(2)}
              disabled={!title.trim() || title.trim().length < 3}
              className="hasbro-btn-primary w-full py-5 text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {t.proposal_cta_configure}
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" variants={container} initial="hidden" animate="show" exit="exit" className="space-y-10">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">{t.proposal_step_narrative_tag}</span>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">{t.proposal_step_narrative_title}</h1>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block">{t.proposal_field_desc_label}</label>
                <textarea 
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setDescTouched(true)}
                  placeholder={t.proposal_field_desc_placeholder}
                  className={`w-full bg-white/[0.02] border rounded-sm p-5 text-xs font-bold uppercase tracking-widest text-white placeholder:text-neutral-800 focus:outline-none transition-all resize-none font-outfit leading-relaxed ${
                    descError ? "border-red-500/50 focus:border-red-500" : "border-white/5 focus:border-brand-yellow/30"
                  }`}
                />
                {descError && (
                  <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {descError}
                  </div>
                )}
                <p className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest text-right">
                  {description.length} / 3000
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-8 py-5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-all">
                {t.proposal_cta_back}
              </button>
              <button 
                onClick={() => goToStep(3)}
                disabled={!description.trim() || description.trim().length < 20}
                className="hasbro-btn-primary flex-1 py-5 text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 font-outfit"
              >
                {t.proposal_cta_upload}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" variants={container} initial="hidden" animate="show" exit="exit" className="space-y-10">
            <div>
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">{t.proposal_step_visual_tag}</span>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">{t.proposal_step_visual_title}</h1>
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
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-800 group-hover:text-neutral-500">{t.proposal_field_upload_label}</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                  </label>
                )}
              </div>
              
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-600 text-center">
                {t.proposal_field_upload_hint}
              </p>

              {files.length === 0 && (
                <div className="flex items-center gap-2 text-amber-500/70 text-[10px] font-bold uppercase tracking-widest justify-center">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  At least one reference image is required
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 font-outfit flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                {t.proposal_cta_back}
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading || files.length === 0}
                className="hasbro-btn-primary flex-1 py-5 text-xs font-black disabled:opacity-50 flex items-center justify-center gap-3 font-outfit"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4 text-black/50" />}
                {t.proposal_cta_submit}
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
               <h1 className="text-5xl font-black uppercase tracking-tighter text-white italic">{dict.custom_order.success_title}</h1>
               <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500">{dict.custom_order.success_subtitle}</p>
            </div>
 
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-400 max-w-sm mx-auto leading-relaxed font-outfit">
              {dict.custom_order.success_message}
            </p>
 
            <button 
              onClick={() => router.push(`/${lang}/account`)}
              className="hasbro-btn-primary px-12 py-5 text-xs font-black font-outfit"
            >
              {dict.custom_order.cta_vault}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
