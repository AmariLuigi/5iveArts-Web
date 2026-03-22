import { getDictionary, Locale } from "@/lib/get-dictionary";
import CheckoutClient from "./CheckoutClient";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/settings";

export default async function CheckoutPageServer({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  const settings = await getSiteSettings();
  const threshold = settings.logistics?.free_shipping_threshold_cents ?? 5000;

  if (!dict) notFound();

  return <CheckoutClient dict={dict} lang={lang} freeShippingThreshold={threshold} />;
}
