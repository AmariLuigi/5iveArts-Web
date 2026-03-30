import { getDictionary, Locale, locales } from "@/lib/get-dictionary";
import FAQClient from "./FAQClient";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    alternates: {
      canonical: `/${lang}/faq`,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/faq`])
      ),
    },
  };
}
export default async function FAQPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale).catch(() => null);

    if (!dict) notFound();

    return <FAQClient dict={dict} />;
}
