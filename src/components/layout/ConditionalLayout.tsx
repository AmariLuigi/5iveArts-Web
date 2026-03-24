"use client";

import dynamic from "next/dynamic";
import { usePathname, useParams } from "next/navigation";
import Navbar from "./Navbar";
import { useSiteSettings } from "@/components/providers/SettingsProvider";

const Footer = dynamic(() => import("./Footer"), { ssr: true });
const AmbientBackground = dynamic(() => import("@/components/ui/AmbientBackground"), { ssr: false });

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
                <div className="bg-brand-yellow text-black text-[10px] uppercase font-black tracking-[0.2em] text-center py-2 px-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-1 md:gap-2">
                        <span>{dict?.features?.fastShipping?.title || "FAST SHIPPING"} — {dict?.features?.fastShipping?.text || "Worldwide"}</span>
                        <span className="hidden md:inline opacity-30">·</span>
                        <div className="flex items-center gap-2">
                            <span>{dict?.features?.secureCheckout?.title || "SECURE CHECKOUT"}</span>
                            <span className="opacity-30">·</span>
                            <span>5iveArts Global</span>
                        </div>
                    </div>
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
