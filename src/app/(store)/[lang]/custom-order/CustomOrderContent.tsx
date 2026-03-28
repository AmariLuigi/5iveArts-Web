"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, 
  Cpu, 
  Paintbrush, 
  CheckCircle2, 
  Truck, 
  History, 
  UserPlus, 
  LogIn,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Layers,
  Wand2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface CustomOrderContentProps {
  dict: any;
  lang: string;
  isLoggedIn: boolean;
}

export default function CustomOrderContent({ dict, lang, isLoggedIn }: CustomOrderContentProps) {
  const t = dict.custom_order;
  
  const steps = [
    {
      title: t.step1_title,
      desc: t.step1_desc,
      icon: Layers,
      color: "text-blue-400",
      bg: "bg-blue-400/5",
      border: "border-blue-400/20"
    },
    {
      title: t.step2_title,
      desc: t.step2_desc,
      icon: Cpu,
      color: "text-purple-400",
      bg: "bg-purple-400/5",
      border: "border-purple-400/20"
    },
    {
      title: t.step3_title,
      desc: t.step3_desc,
      icon: ShieldCheck,
      color: "text-brand-yellow",
      bg: "bg-brand-yellow/5",
      border: "border-brand-yellow/20"
    },
    {
      title: t.step4_title,
      desc: t.step4_desc,
      icon: Paintbrush,
      color: "text-green-400",
      bg: "bg-green-400/5",
      border: "border-green-400/20"
    },
    {
      title: t.step5_title,
      desc: t.step5_desc,
      icon: Truck,
      color: "text-orange-400",
      bg: "bg-orange-400/5",
      border: "border-orange-400/20"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 100 
      } 
    }
  } as const;

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/custom-order-hero.png" 
            alt="Custom Commission Workshop" 
            fill 
            className="object-cover opacity-60 grayscale brightness-75 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 z-10" />
        </div>

        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-yellow/20 bg-brand-yellow/5 mb-8 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-brand-yellow shadow-[0_0_10px_#ff9f00]" />
              <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow italic">Advanced Custom Protocol</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white italic leading-[0.9] mb-8">
              {t.hero_title}
            </h1>
            
            <p className="text-lg md:text-xl font-bold uppercase tracking-widest text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              {t.hero_subtitle}
            </p>

            {!isLoggedIn && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href={`/${lang}/login`} className="hasbro-btn-primary px-12 py-5 text-sm font-black group">
                  <span className="flex items-center gap-3">
                    <LogIn className="w-4 h-4" />
                    {t.cta_login}
                  </span>
                </Link>
                <Link href={`/${lang}/login?register=true`} className="text-white hover:text-brand-yellow font-black uppercase tracking-widest text-xs transition-colors flex items-center gap-2 group">
                   {t.cta_register}
                   <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}

            {isLoggedIn && (
              <button className="hasbro-btn-primary px-16 py-6 text-sm font-black group shadow-[0_0_30px_rgba(255,159,0,0.2)]">
                <span className="flex items-center gap-3">
                   <Wand2 className="w-5 h-5 shadow-[0_0_10px_#000]" />
                   {t.cta_start}
                </span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Floating background elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10" />
      </section>

      {/* Process Flow Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
             <div className="max-w-xl">
               <span className="text-[10px] uppercase font-black tracking-[0.5em] text-neutral-500 mb-4 block">System Logistics</span>
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white italic">
                 {t.flow_title}
               </h2>
             </div>
             <div className="hidden md:block w-32 h-px bg-white/10 mb-6" />
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-5 gap-8"
          >
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div key={idx} variants={item} className="group flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${step.border} ${step.bg} mb-8 group-hover:scale-110 transition-all duration-500 shadow-[0_0_30px_transparent] group-hover:shadow-[0_0_30px_rgba(255,159,0,0.1)] relative`}>
                    <Icon className={`w-8 h-8 ${step.color}`} />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-[11px] font-black text-white italic">
                      {idx + 1}
                    </div>
                  </div>
                  <h3 className="text-[12px] font-black uppercase tracking-widest text-white mb-4 text-center leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 text-center leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Login CTA Section (If Guest) */}
      {!isLoggedIn && (
        <section className="py-32 px-4 border-t border-white/5 bg-gradient-to-b from-black to-[#050505]">
           <div className="max-w-4xl mx-auto">
              <div className="hasbro-card p-12 text-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <History className="w-64 h-64 text-brand-yellow" />
                 </div>
                 
                 <div className="relative z-10">
                    <div className="w-20 h-20 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-10">
                       <UserPlus className="w-8 h-8 text-brand-yellow" />
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white italic mb-6">
                      {t.auth_invite_title}
                    </h2>
                    
                    <p className="text-sm font-bold uppercase tracking-widest text-neutral-400 max-w-2xl mx-auto mb-12">
                      {t.auth_invite_desc}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                       <Link href={`/${lang}/login`} className="hasbro-btn-primary px-12 py-5 text-xs font-black w-full sm:w-auto">
                          {t.cta_login}
                       </Link>
                       <Link href={`/${lang}/login?register=true`} className="px-12 py-5 border border-white/10 hover:bg-white/5 transition-all text-white text-xs font-black uppercase tracking-widest w-full sm:w-auto">
                          {t.cta_register}
                       </Link>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Benefits Footer */}
      <section className="py-20 px-4">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 border border-brand-yellow/20 rounded shrink-0 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-brand-yellow" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2">Verified Security</h4>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 leading-relaxed">
                     End-to-end encrypted asset transfers and secure payment integration for every commission.
                  </p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 border border-brand-yellow/20 rounded shrink-0 flex items-center justify-center">
                  <History className="w-5 h-5 text-brand-yellow" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2">Progress Transparency</h4>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 leading-relaxed">
                     Real-time visual records added to your personal vault throughout the fabrication lifecycle.
                  </p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 border border-brand-yellow/20 rounded shrink-0 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-brand-yellow" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-2">Artisan Control</h4>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 leading-relaxed">
                     Direct collaboration with our lead curators to ensure your prototype meets museum-grade standards.
                  </p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
