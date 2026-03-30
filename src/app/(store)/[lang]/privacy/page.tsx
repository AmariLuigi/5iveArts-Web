import { getDictionary, Locale, locales } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";
import AmbientBackground from "@/components/ui/AmbientBackground";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null) as any;
  
  return {
    title: `${dict?.privacy_policy?.title || 'Privacy Policy'} — 5iveArts`,
    description: `5iveArts ${dict?.privacy_policy?.title || 'Privacy Policy'}`,
    metadataBase: new URL('https://www.5ivearts.com'),
    alternates: {
      canonical: `/${lang}/privacy`,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/privacy`])
      ),
    },
  };
}
export async function generateStaticParams() {
    return locales.map((lang) => ({ lang }));
}

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale).catch(() => null) as any;
    if (!dict) notFound();

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <AmbientBackground />
            
            <div className="max-w-4xl mx-auto px-6 py-24 relative z-10">
                <header className="mb-16">
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-white">
                        {dict.privacy_policy.title}
                    </h1>
                    <div className="h-1 w-24 bg-brand-yellow mb-8" />
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                        {dict.privacy_policy.lastUpdated}
                    </p>
                </header>

                <div className="prose prose-invert prose-brand max-w-none">
                    <div className="grid grid-cols-1 gap-16">
                        {dict.privacy_policy.sections.map((section: any, i: number) => (
                            <section key={i} className="group border-l border-white/5 pl-8 hover:border-brand-yellow/30 transition-colors duration-500 relative">
                                <div className="absolute left-[-1px] top-0 w-[1px] h-0 group-hover:h-full bg-brand-yellow transition-all duration-700" />
                                <h2 className="text-xl font-black uppercase tracking-widest text-brand-yellow mb-6 group-hover:translate-x-2 transition-transform duration-300">
                                    {section.title}
                                </h2>
                                <p className="text-neutral-400 leading-relaxed font-medium text-sm md:text-base">
                                    {section.content}
                                </p>
                            </section>
                        ))}
                    </div>
                </div>

                <footer className="mt-24 pt-12 border-t border-white/5">
                    <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold">
                        5iveArts Legal Protocol — Deployment March 2026
                    </p>
                </footer>
            </div>

            {/* Subtle glow effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-yellow/5 blur-[150px] rounded-full animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-yellow/5 blur-[150px] rounded-full animate-pulse-glow" />
            </div>
        </div>
    );
}


