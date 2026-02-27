"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Announcement bar */}
            <div className="bg-brand-yellow text-black text-[10px] uppercase font-black tracking-[0.2em] text-center py-2 px-4">
                Free standard shipping on all orders over €50 &nbsp;·&nbsp; Each figure handcrafted with passion &nbsp;·&nbsp; 30-day returns
            </div>
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </>
    );
}
