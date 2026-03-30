import { getDictionary, Locale, locales } from "@/lib/get-dictionary";
import { getSiteSettings } from "@/lib/settings";
import CartClient from "./CartClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null) as any;
  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    title: `${dict?.cart?.title || 'Vault Cart'} — 5iveArts Collector Series`,
    alternates: {
      canonical: `/${lang}/cart`,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/cart`])
      ),
    },
  };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  const settings = await getSiteSettings();
  const threshold = settings.logistics?.free_shipping_threshold_cents ?? 25000;

  if (!dict) notFound();

  return <CartClient dict={dict} lang={lang} freeShippingThreshold={threshold} />;
}
