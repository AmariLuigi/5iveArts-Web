import { getDictionary, Locale, locales } from "@/lib/get-dictionary";
import { createClient } from "@/lib/supabase-server";
import CustomOrderContent from "./CustomOrderContent";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    alternates: {
      canonical: `/${lang}/custom-order`,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/custom-order`])
      ),
    },
  };
}
interface Props {
  params: Promise<{
    lang: string;
  }>;
}

export default async function CustomOrderPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  
  if (!dict) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <CustomOrderContent 
      dict={dict} 
      lang={lang} 
      isLoggedIn={!!user} 
    />
  );
}
