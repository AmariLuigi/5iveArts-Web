import { Suspense } from "react";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import TerminalForm from "./TerminalForm";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null) as any;
  return {
    title: `${dict?.auth?.title || 'Access Terminal'} — 5iveArts Secure Portal`,
    description: dict?.auth?.subtitle || "Access your high-end figure collection and logistics reports."
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
