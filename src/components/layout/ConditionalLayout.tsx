"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useSiteSettings } from "@/components/providers/SettingsProvider";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logistics } = useSiteSettings();
    const threshold = logistics?.free_shipping_threshold_cents ? logistics.free_shipping_threshold_cents / 100 : 50;
    const isAdmin = pathname?.startsWith("/admin");

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Announcement bar */}
            <div className="bg-brand-yellow text-black text-[10px] uppercase font-black tracking-[0.2em] text-center py-2 px-4 whitespace-nowrap overflow-hidden">
                Free standard shipping on all orders over €{threshold} &nbsp;·&nbsp; Each figure handcrafted with passion &nbsp;·&nbsp; 30-day returns
            </div>
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </>
    );
}
