"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Tag,
    LogOut,
    ChevronRight,
    Settings,
    ShieldCheck,
    User,
    BarChart3
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    if (pathname === "/admin/login") return null;

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    };

    const navItems = [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Manage Orders", href: "/admin/orders", icon: ShoppingCart },
        { label: "Products", href: "/admin/products", icon: Tag },
        { label: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <aside className="w-72 bg-[#050505] border-r border-white/5 flex flex-col h-screen fixed top-0 left-0 z-50">
            {/* Brand */}
            <div className="p-8 border-b border-white/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-brand-yellow rounded-sm flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-[11px] uppercase font-black tracking-[0.4em] text-white">5iveArts</span>
                </div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-600 block">System Administrator</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-sm transition-all group ${isActive
                                ? "bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow"
                                : "text-neutral-500 hover:text-white hover:bg-white/[0.02]"
                                }`}
                        >
                            <item.icon className={`w-4 h-4 transition-colors ${isActive ? "text-brand-yellow" : "group-hover:text-brand-yellow"}`} />
                            <span className="text-[10px] uppercase font-black tracking-widest">{item.label}</span>
                            {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3 px-4 py-2 opacity-50">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 truncate">Admin Terminal</span>
                </div>

                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-sm group"
                >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] uppercase font-black tracking-widest">Terminate Session</span>
                </button>
            </div>
        </aside>
    );
}
