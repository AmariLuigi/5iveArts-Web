import type { Metadata } from "next";
import AdminLayoutBody from "./AdminLayoutBody";

export const metadata: Metadata = {
    title: "Admin Dashboard | 5iveArts",
    description: "Secure management portal for 5iveArts Collector Series.",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminLayoutBody>
            {children}
        </AdminLayoutBody>
    );
}
