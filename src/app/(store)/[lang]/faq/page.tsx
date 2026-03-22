import { getDictionary, Locale } from "@/lib/get-dictionary";
import FAQClient from "./FAQClient";
import { notFound } from "next/navigation";

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
