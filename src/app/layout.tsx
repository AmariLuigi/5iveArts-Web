import type { Metadata } from "next";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "5iveArts — Hand-Painted & 3D-Printed Action Figures",
  description:
    "Unique hand-painted and home 3D-printed action figures, crafted with passion. Every piece is a one-of-a-kind work of art. Shop online with fast shipping.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSettings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-black text-white min-h-screen flex flex-col">
        <SettingsProvider initialSettings={initialSettings}>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}

