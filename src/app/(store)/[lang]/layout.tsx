import type { Metadata } from "next";
import "../../globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { getSiteSettings } from "@/lib/settings";
import { locales, Locale, getDictionary } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "5iveArts — Hand-Painted & 3D-Printed Action Figures",
  description:
    "Unique hand-painted and home 3D-printed action figures, crafted with passion. Every piece is a one-of-a-kind work of art. Shop online with fast shipping.",
};

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
      <body className="antialiased bg-black text-white min-h-screen flex flex-col">
        <SettingsProvider initialSettings={initialSettings}>
          <ConditionalLayout dict={dict}>
            {children}
          </ConditionalLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}
