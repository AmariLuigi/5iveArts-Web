import type { Metadata } from "next";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-black text-white min-h-screen flex flex-col">
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}

