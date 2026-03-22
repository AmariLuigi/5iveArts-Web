"use client";

import { usePathname, useParams } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useSiteSettings } from "@/components/providers/SettingsProvider";
import AmbientBackground from "@/components/ui/AmbientBackground";

export interface ConditionalLayoutProps {
    children: React.ReactNode;
    dict: any;
}

export default function ConditionalLayout({ children, dict }: ConditionalLayoutProps) {
    const pathname = usePathname();
    const params = useParams();
    const lang = params.lang as string;
    
    const { logistics } = useSiteSettings();
    const threshold = logistics?.free_shipping_threshold_cents ? logistics.free_shipping_threshold_cents / 100 : 50;
    
    const isLoginPage = pathname?.includes("/login") || pathname?.includes("/admin/login");
    const isAdmin = pathname?.startsWith("/admin");

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Announcement bar */}
            {!isLoginPage && (
                <div className="bg-brand-yellow text-black text-[10px] uppercase font-black tracking-[0.2em] text-center py-2 px-4 whitespace-nowrap overflow-hidden">
                    {dict.features.fastShipping.title} — {dict.features.fastShipping.text} &nbsp;·&nbsp; {dict.features.secureCheckout.title} &nbsp;·&nbsp; 5iveArts Global
                </div>
            )}
            <Navbar dict={dict} lang={lang} />
            <AmbientBackground />
            <main className="flex-1 relative z-10">
                {children}
            </main>
            <Footer dict={dict} lang={lang} />
        </>
    );
}
