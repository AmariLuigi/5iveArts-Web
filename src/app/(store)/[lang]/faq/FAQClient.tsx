"use client";

import { Mail, MessageSquare, ShieldQuestion } from "lucide-react";

export default function FAQClient({ dict }: { dict: any }) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-4 block">{dict.faq.infoCenter}</span>
                <h1 className="text-6xl font-black uppercase tracking-tighter text-white mb-6 italic">{dict.faq.title}</h1>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                    {dict.faq.subtitle}
                </p>
            </div>

            {/* FAQ List */}
            <div className="space-y-4 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                {dict.faq.questions.map((faq: any, i: number) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm group hover:border-white/10 transition-all shadow-2xl">
                        <div className="flex items-start gap-6">
                            <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-brand-yellow/10 group-hover:border-brand-yellow/20 transition-all">
                                <ShieldQuestion className="w-5 h-5 text-neutral-600 group-hover:text-brand-yellow transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-3">{faq.q}</h3>
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Contact Section */}
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-sm text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4 italic">{dict.faq.stillHaveQuestions}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-10 pb-10 border-b border-white/5">
                    {dict.faq.curatorsMessage}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    <a href="mailto:studio@5ivearts.com" className="hasbro-card p-6 flex flex-col items-center gap-4 hover:border-brand-yellow/20 transition-all group">
                        <Mail className="w-6 h-6 text-neutral-700 group-hover:text-brand-yellow transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{dict.faq.emailUs}</span>
                        <span className="text-[9px] font-bold text-neutral-500 lowercase">studio@5ivearts.com</span>
                    </a>
                    <div className="hasbro-card p-6 flex flex-col items-center gap-4 border-dashed border-neutral-900 opacity-50 cursor-not-allowed">
                        <MessageSquare className="w-6 h-6 text-neutral-700" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{dict.faq.liveChat}</span>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">{dict.faq.offline}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
