import type { Metadata } from "next";
import "../../globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { getSiteSettings } from "@/lib/settings";
import { locales, Locale, getDictionary } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReferralTracker } from "@/components/referral/ReferralTracker";

import OrganizationSchema from "@/components/seo/OrganizationSchema";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import CookieBanner from "@/components/layout/CookieBanner";
import CustomCursor from "@/components/ui/CustomCursor";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;

  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    title: {
      default: "5iveArts — Hand-Painted & 3D-Printed Action Figures",
      template: "%s | 5iveArts"
    },
    icons: {
      icon: "/favicon.ico",
    },
    description: "Unique hand-painted and home 3D-printed action figures, crafted with passion. Every piece is a one-of-a-kind work of art. Shop online with fast shipping.",
    openGraph: {
      type: 'website',
      siteName: '5iveArts',
      title: '5iveArts — Hand-Painted & 3D-Printed Action Figures',
      description: 'Unique hand-painted and home 3D-printed action figures, crafted with passion. Every piece is a one-of-a-kind work of art.',
      url: `https://www.5ivearts.com/${lang}`,
      images: [{ url: '/logo.svg', width: 1200, height: 630, alt: '5iveArts' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '5iveArts — Hand-Painted & 3D-Printed Action Figures',
      description: 'Unique hand-painted and home 3D-printed action figures, crafted with passion. Every piece is a one-of-a-kind work of art.',
      images: ['/logo.svg'],
    },
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}`])
      ),
    },
  };
}

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Use type guard to safely check if current lang is a supported locale
  if (!locales.includes(lang as any)) {
    notFound();
  }

  const [initialSettings, dict] = await Promise.all([
    getSiteSettings(),
    getDictionary(lang as Locale)
  ]);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-black text-white min-h-screen flex flex-col`}>
        <OrganizationSchema />
        <SettingsProvider initialSettings={initialSettings}>
          <ConditionalLayout dict={dict}>
            {children}
          </ConditionalLayout>
        </SettingsProvider>
        <Analytics />
        <SpeedInsights />
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <CookieBanner dict={dict} lang={lang} />
        <CustomCursor />
      </body>
    </html>
  );
}
