"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, ChevronDown, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MiniCart from "@/components/cart/MiniCart";
import { createClient } from "@/lib/supabase-browser";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

export interface NavbarProps {
  dict: any;
  lang: string;
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export default function Navbar({ dict, lang }: NavbarProps) {
  const items = useCartStore((state) => state.items);
  const cartTotal = items.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [isLangHovered, setIsLangHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const langTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleCartEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsCartHovered(true);
  };

  const handleCartLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsCartHovered(false);
    }, 300);
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const redirectedPathname = (targetLang: string) => {
    if (!pathname) return "/";
    const segments = pathname.split("/");
    segments[1] = targetLang;
    return segments.join("/");
  };

  const totalItems = mounted ? cartTotal : 0;

  return (
    <header className="sticky top-0 z-50 bg-[#000000] border-b border-[#222] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${lang}`} className="flex flex-col group -space-y-1">
            <span className="font-black text-xl uppercase tracking-tighter text-white transition-colors group-hover:text-brand-yellow">5ive</span>
            <span className="font-black text-[10px] uppercase tracking-[0.4em] text-brand-yellow/80">Arts</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-white">
            <Link href={`/${lang}/products`} className="hover:text-brand-yellow transition-all flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-brand-yellow transition-all" />
              {dict.nav.products}
            </Link>
            <Link href={`/${lang}/faq`} className="hover:text-brand-yellow transition-all">
              {dict.nav.faq}
            </Link>
            <Link href={`/${lang}/shipping`} className="hover:text-brand-yellow transition-all">
              {dict.nav.shipping}
            </Link>
          </nav>

          {/* Global Terminal: Cart + Lang + User */}
          <div className="flex items-center gap-6">
            
            {/* Language Selection */}
            <div 
              className="relative hidden lg:block"
              onMouseEnter={() => { if (langTimeoutRef.current) clearTimeout(langTimeoutRef.current); setIsLangHovered(true); }}
              onMouseLeave={() => { langTimeoutRef.current = setTimeout(() => setIsLangHovered(false), 300); }}
            >
              <button 
                className="flex items-center gap-2 py-4 px-2 hover:text-brand-yellow transition-all"
                aria-label={dict.nav.switchRegion}
                aria-haspopup="listbox"
                aria-expanded={isLangHovered}
              >
                <span className="text-lg">{currentLang.flag}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isLangHovered ? 'rotate-180' : ''}`} />
              </button>
              
              {isLangHovered && (
                <div className="absolute right-0 top-full pt-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-black border border-white/10 rounded-sm shadow-2xl p-2 min-w-[160px]">
                    <div className="px-3 py-2 border-b border-white/5 mb-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600">{dict.nav.switchRegion}</span>
                    </div>
                    {LANGUAGES.map(l => (
                      <Link
                        key={l.code}
                        href={redirectedPathname(l.code)}
                        className={`flex items-center justify-between px-3 py-2 text-[10px] uppercase font-black tracking-widest hover:bg-white/5 transition-all w-full text-left ${lang === l.code ? 'text-brand-yellow' : 'text-neutral-400'}`}
                        aria-label={`${dict.nav.switchRegion} to ${l.label}`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-base">{l.flag}</span>
                          {l.label}
                        </span>
                        {lang === l.code && <div className="w-1 h-1 rounded-full bg-brand-yellow shadow-[0_0_8px_#ff9f00]" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={handleCartEnter}
              onMouseLeave={handleCartLeave}
            >
              <Link
                href={`/${lang}/cart`}
                className="flex items-center gap-3 text-white hover:text-brand-yellow transition-all py-4"
                aria-label={`${dict.nav.cart} (${totalItems} items)`}
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-brand-yellow text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </div>
                <div className="hidden xl:flex flex-col -space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{dict.nav.cart}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">{dict.nav.vault}</span>
                </div>
              </Link>
              {isCartHovered && typeof window !== 'undefined' && window.matchMedia("(hover: hover)").matches && (
                <div className="absolute right-0 top-full pt-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                  <MiniCart dict={dict} lang={lang} />
                </div>
              )}
            </div>

            <Link
              href={user ? `/${lang}/account` : `/${lang}/login`}
              className="flex items-center gap-1 text-white hover:text-brand-yellow transition-all"
              title={user ? dict.nav.warehouse : dict.nav.access}
            >
              <User className={`w-6 h-6 ${user ? 'text-brand-yellow' : ''}`} />
            </Link>


            <button
              className="md:hidden text-white"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden bg-[#0a0a0a] border-t border-white/5 px-6 py-10 flex flex-col gap-10 min-h-screen animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-2 gap-4">
            {LANGUAGES.map(l => (
              <Link
                key={l.code}
                href={redirectedPathname(l.code)}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 text-[9px] font-black uppercase tracking-widest ${lang === l.code ? 'border-brand-yellow text-brand-yellow' : 'text-neutral-500'}`}
              >
                <span className="text-xl">{l.flag}</span>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-white">
            <Link href={`/${lang}/products`} onClick={() => setMenuOpen(false)} className="hover:text-brand-yellow">{dict.nav.products}</Link>
            <Link href={`/${lang}/faq`} onClick={() => setMenuOpen(false)} className="hover:text-brand-yellow">{dict.nav.faq}</Link>
            <Link href={`/${lang}/shipping`} onClick={() => setMenuOpen(false)} className="hover:text-brand-yellow">{dict.nav.shipping}</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
