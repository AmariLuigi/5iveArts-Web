"use client";

import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";

export interface FooterProps {
  dict: any;
  lang: string;
}

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'it', flag: '🇮🇹' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'pt', flag: '🇵🇹' },
  { code: 'nl', flag: '🇳🇱' },
  { code: 'pl', flag: '🇵🇱' },
];

export default function Footer({ dict, lang }: FooterProps) {
  return (
    <footer className="bg-black text-white border-t border-white/5 py-24 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24 relative z-10">
        
        {/* Brand Column */}
        <div className="space-y-8">
          <Link href={`/${lang}`} className="flex flex-col group -space-y-1">
            <span className="font-black text-3xl uppercase tracking-tighter text-white transition-colors group-hover:text-brand-yellow">5ive</span>
            <span className="font-black text-xs uppercase tracking-[0.5em] text-brand-yellow/80">Arts</span>
          </Link>
          <p className="text-[10px] uppercase font-black tracking-widest leading-relaxed text-neutral-400">
            {dict.footer.description}
          </p>
          <div className="flex gap-4">
            <button 
              className="w-10 h-10 bg-white/[0.02] border border-white/5 flex items-center justify-center hover:bg-brand-yellow hover:text-black transition-all rounded-sm"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </button>
            <button 
              className="w-10 h-10 bg-white/[0.02] border border-white/5 flex items-center justify-center hover:bg-brand-yellow hover:text-black transition-all rounded-sm"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Discovery Column */}
        <div className="space-y-8">
          <h2 className="text-[8px] uppercase font-black tracking-[0.4em] text-neutral-400 mb-8">{dict.nav.discovery}</h2>
          <ul className="space-y-4 text-[10px] uppercase font-black tracking-widest">
            <li><Link href={`/${lang}/products`} className="hover:text-brand-yellow transition-all flex items-center gap-3">{dict.nav.products}</Link></li>
            <li><Link href={`/${lang}/faq`} className="hover:text-brand-yellow transition-all flex items-center gap-3">{dict.nav.faq}</Link></li>
            <li><Link href={`/${lang}/shipping`} className="hover:text-brand-yellow transition-all flex items-center gap-3">{dict.nav.shipping}</Link></li>
          </ul>
        </div>

        {/* Account Column */}
        <div className="space-y-8">
          <h2 className="text-[8px] uppercase font-black tracking-[0.4em] text-neutral-400 mb-8">{dict.nav.terminal}</h2>
          <ul className="space-y-4 text-[10px] uppercase font-black tracking-widest text-neutral-400">
            <li><Link href={`/${lang}/login`} className="hover:text-brand-yellow transition-all">{dict.nav.login}</Link></li>
            <li><Link href={`/${lang}/login?register=true`} className="hover:text-brand-yellow transition-all">{dict.auth.register}</Link></li>
            <li><Link href={`/${lang}/cart`} className="hover:text-brand-yellow transition-all">{dict.cart.title}</Link></li>
          </ul>
        </div>

        {/* Region Column */}
        <div className="space-y-8">
          <h2 className="text-[8px] uppercase font-black tracking-[0.4em] text-neutral-400 mb-8">{dict.nav.regional}</h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <Link 
                key={l.code} 
                href={`/${l.code}`} 
                aria-label={`Switch to ${l.code === 'en' ? 'English' : l.code === 'it' ? 'Italian' : l.code === 'es' ? 'Spanish' : l.code === 'fr' ? 'French' : 'German'}`}
                className={`w-10 h-10 bg-white/[0.02] border flex items-center justify-center text-lg hover:border-brand-yellow transition-all rounded-sm ${lang === l.code ? 'border-brand-yellow bg-brand-yellow/10' : 'border-white/5'}`}
              >
                {l.flag}
              </Link>
            ))}
          </div>
          <p className="text-[8px] uppercase font-black tracking-[0.4em] text-neutral-400">{dict.footer.logistics}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <span className="text-[8px] uppercase font-black tracking-[0.5em] text-neutral-400">
          {dict.footer.rights}
        </span>
        <div className="flex gap-10 text-[8px] uppercase font-black tracking-[0.5em] text-neutral-400">
          <Link href={`/${lang}/privacy`} className="hover:text-brand-yellow transition-colors">{dict.footer.privacy}</Link>
          <Link href={`/${lang}/terms`} className="hover:text-brand-yellow transition-colors">{dict.footer.terms}</Link>
        </div>
      </div>

      {dict.footer.seoAbout && (
        <div className="max-w-7xl mx-auto mt-16 px-4">
          <p className="text-[11px] font-medium leading-relaxed text-neutral-400 text-center max-w-4xl mx-auto italic">
            {dict.footer.seoAbout}
          </p>
        </div>
      )}
    </footer>
  );
}
