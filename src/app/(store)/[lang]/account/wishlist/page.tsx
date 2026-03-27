import { getDictionary, Locale } from "@/lib/get-dictionary";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import dynamic from "next/dynamic";
const WishlistClient = dynamic(() => import("./WishlistClient")) as any;

export default async function WishlistPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = (await getDictionary(lang as Locale).catch(() => null)) as any;

    if (!dict) notFound();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-black py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                        {dict.account?.wishlist?.title || "My Curator Wishlist"}
                    </h1>
                    <p className="text-brand-yellow/60 text-[11px] uppercase tracking-[0.4em] font-black">
                        {dict.account?.wishlist?.subtitle || "Artifacts Under Observation"}
                    </p>
                </div>

                <WishlistClient lang={lang} dict={dict} />
            </div>
        </div>
    );
}
