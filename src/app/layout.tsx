import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "5iveArts — Hand-Painted & 3D-Printed Action Figures",
  description:
    "Unique hand-painted and home 3D-printed action figures, crafted with passion. Every piece is a one-of-a-kind work of art. Shop online with fast shipping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen flex flex-col">
        {/* Announcement bar */}
        <div className="bg-indigo-700 text-white text-xs sm:text-sm text-center py-2 px-4 font-medium">
          🇬🇧 Free shipping on all UK orders &nbsp;·&nbsp; Each figure handcrafted with passion &nbsp;·&nbsp; 30-day hassle-free returns
        </div>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

