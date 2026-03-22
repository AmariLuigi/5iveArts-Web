"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SiteSettings, getSiteSettings } from "@/lib/settings";

const SettingsContext = createContext<SiteSettings | null>(null);

export function SettingsProvider({ children, initialSettings }: { children: React.ReactNode, initialSettings: SiteSettings }) {
    const [settings, setSettings] = useState<SiteSettings>(initialSettings);

    // Optionally re-validate or fetch fresh settings occasionally
    useEffect(() => {
        // If initial settings were empty or we want to ensure latest from DB
        if (!initialSettings.pricing || !initialSettings.logistics) {
            getSiteSettings().then(setSettings);
        }
    }, [initialSettings]);

    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSiteSettings = () => useContext(SettingsContext) || {};
