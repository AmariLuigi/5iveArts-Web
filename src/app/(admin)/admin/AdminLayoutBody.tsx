"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayoutBody({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";

    return (
        <div className="min-h-screen bg-black text-white flex">
            {!isLoginPage && <AdminSidebar />}
            <main className={`flex-1 min-h-screen ${!isLoginPage ? "lg:ml-72" : ""}`}>
                {children}
            </main>
        </div>
    );
}
