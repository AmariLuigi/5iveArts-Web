import { getDictionary, Locale } from "@/lib/get-dictionary";
import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import CustomOrderProposeForm from "./CustomOrderProposeForm";

interface Props {
  params: Promise<{
    lang: string;
  }>;
}

export default async function ProposeCustomOrderPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  
  if (!dict) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protect the route
  if (!user) {
    redirect(`/${lang}/login?returnTo=/${lang}/custom-order/propose`);
  }

  return (
    <div className="min-h-screen bg-black py-32 px-4 relative overflow-hidden">
      {/* Visual background atmospheric elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-yellow/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-yellow/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <CustomOrderProposeForm dict={dict} lang={lang} />
      </div>
    </div>
  );
}
