import { Suspense } from "react";
import { getDictionary, Locale, locales } from "@/lib/get-dictionary";
import TerminalForm from "./TerminalForm";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ 
  params,
  searchParams,
}: { 
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const resolvedSearchParams = await searchParams;
  const register = resolvedSearchParams?.register === 'true';
  const dict = await getDictionary(lang as Locale).catch(() => null) as any;
  const queryString = register ? `?register=true` : "";
  const canonicalPath = `/${lang}/login${queryString}`;
  
  const baseDesc = dict?.auth?.subtitle || "Access your high-end figure collection and logistics reports.";
  const dynamicDesc = register 
    ? (dict?.auth?.registerSubtitle || `Create a new 5iveArts Collector account to track deliveries. ${baseDesc}`)
    : baseDesc;

  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    title: register ? `${dict?.auth?.register || 'Create Account'} — 5iveArts Secure Portal` : `${dict?.auth?.title || 'Access Terminal'} — 5iveArts Secure Portal`,
    description: dynamicDesc,
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/login${queryString}`])
      ),
    },
  };
}

export default async function AccessTerminalPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale).catch(() => null);

    if (!dict) notFound();

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
            </div>
        }>
            <TerminalForm dict={dict} lang={lang} />
        </Suspense>
    );
}
