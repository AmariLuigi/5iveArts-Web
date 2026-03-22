import { getDictionary, Locale } from "@/lib/get-dictionary";
import SuccessClient from "./SuccessClient";
import { notFound } from "next/navigation";

export default async function SuccessPageServer({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);

  if (!dict) notFound();

  return <SuccessClient dict={dict} lang={lang} />;
}
