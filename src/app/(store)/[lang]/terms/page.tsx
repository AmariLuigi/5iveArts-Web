import { getDictionary, Locale } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
    return [
        { lang: "en" },
        { lang: "it" },
        { lang: "es" },
        { lang: "fr" },
        { lang: "de" },
    ];
}

export default async function TermsPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale).catch(() => null) as any;
    if (!dict) notFound();

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-4xl mx-auto px-6 py-20">
                <h1 className="text-4xl font-black text-neutral-900 mb-8">
                    {dict.terms_of_service.title}
                </h1>
                <div className="prose prose-lg max-w-none">
                    <p className="text-neutral-600">
                        {dict.terms_of_service.lastUpdated}
                    </p>
                    <div className="mt-8 space-y-6 text-neutral-700">
                        {dict.terms_of_service.sections.map((section: any, i: number) => (
                            <section key={i}>
                                <h2 className="text-xl font-bold text-neutral-900 mb-3">{section.title}</h2>
                                <p>{section.content}</p>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

