import { getDictionary, Locale } from "@/lib/get-dictionary";
import { createClient } from "@/lib/supabase-server";
import CustomOrderContent from "./CustomOrderContent";
import { notFound } from "next/navigation";

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
