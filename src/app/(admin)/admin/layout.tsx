import type { Metadata } from "next";
import "../../globals.css";
import AdminLayoutBody from "./AdminLayoutBody";

export const metadata: Metadata = {
    title: "Admin Dashboard | 5iveArts",
    description: "Secure management portal for 5iveArts Collector Series.",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-black text-white min-h-screen antialiased">
                <AdminLayoutBody>
                    {children}
                </AdminLayoutBody>
            </body>
        </html>
    );
}
