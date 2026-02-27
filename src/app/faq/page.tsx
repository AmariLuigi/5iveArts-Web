import { ChevronRight, HelpCircle, Mail, MessageSquare, ShieldQuestion } from "lucide-react";
import Link from "next/link";

export default function FAQPage() {
    const faqs = [
        {
            q: "How are the figures made?",
            a: "Every figure starts as a high-resolution 3D print (0.025mm layer height) using industrial-grade resin. Once cured, our artists spend hours hand-painting each piece with professional acrylics and airbrush techniques, finishing with a museum-quality UV-resistant varnish."
        },
        {
            q: "Do you ship internationally?",
            a: "Yes! We ship from our studio in Italy to collectors worldwide. We use insured global couriers to ensure your masterpiece arrives safely."
        },
        {
            q: "How long does production take?",
            a: "Since each piece is made-to-order or hand-finished, please allow 7-14 days for production before shipment. We don't rush the art."
        },
        {
            q: "What is your return policy?",
            a: "We offer a 30-day return policy for items that arrive damaged or significantly different from the description. Because these are handmade art pieces, we cannot accept returns for 'change of mind'."
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-20">
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-brand-yellow mb-4 block">Information Center</span>
                <h1 className="text-6xl font-black uppercase tracking-tighter text-white mb-6">F.A.Q & Contact</h1>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                    Everything you need to know about our artisan process, logistics, and collector protocols.
                </p>
            </div>

            {/* FAQ List */}
            <div className="space-y-4 mb-24">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm group hover:border-white/10 transition-all">
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
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-yellow/20" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4">Still have questions?</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-10 pb-10 border-b border-white/5">
                    Our curators are standing by to assist with custom orders & support.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    <a href="mailto:hello@5ivearts.com" className="hasbro-card p-6 flex flex-col items-center gap-4 hover:border-brand-yellow/20 transition-all group">
                        <Mail className="w-6 h-6 text-neutral-700 group-hover:text-brand-yellow transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Email Us</span>
                        <span className="text-[9px] font-bold text-neutral-500 lowercase">hello@5ivearts.com</span>
                    </a>
                    <div className="hasbro-card p-6 flex flex-col items-center gap-4 border-dashed border-neutral-900 opacity-50 cursor-not-allowed">
                        <MessageSquare className="w-6 h-6 text-neutral-700" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Chat</span>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">Offline</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
