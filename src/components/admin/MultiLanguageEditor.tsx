"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Check, AlertCircle, Globe, Languages, Loader2, Sparkles } from "lucide-react";

export interface Language {
    code: string;
    name: string;
    flag: string;
    nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: "en", name: "English", flag: "🇬🇧", nativeName: "English" },
    { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
    { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
    { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
    { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
];

export interface MultiLanguageEditorProps {
    descriptions: Record<string, string | null>;
    onChange: (descriptions: Record<string, string | null>) => void;
    labels?: {
        title?: string;
        placeholder?: string;
        unsavedChanges?: string;
        atLeastOneRequired?: string;
        translating?: string;
        translateError?: string;
    };
    required?: boolean;
}

export default function MultiLanguageEditor({
    descriptions,
    onChange,
    labels = {},
    required = false,
}: MultiLanguageEditorProps) {
    const [activeTab, setActiveTab] = useState<string>("en");
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translateProgress, setTranslateProgress] = useState<string | null>(null);
    const [translateError, setTranslateError] = useState<string | null>(null);
    const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get initial data from descriptions
    const getDescription = useCallback(
        (langCode: string): string => {
            return descriptions[langCode] || "";
        },
        [descriptions]
    );

    const handleTabChange = (newTab: string) => {
        if (isDirty && activeTab !== newTab) {
            setPendingTab(newTab);
            setShowUnsavedWarning(true);
            return;
        }
        setActiveTab(newTab);
    };

    const handleConfirmTabChange = () => {
        setIsDirty(false);
        if (pendingTab) {
            setActiveTab(pendingTab);
            setPendingTab(null);
        }
        setShowUnsavedWarning(false);
    };

    const handleCancelTabChange = () => {
        setShowUnsavedWarning(false);
        setPendingTab(null);
    };

    const handleDescriptionChange = (value: string) => {
        setIsDirty(true);
        onChange({
            ...descriptions,
            [activeTab]: value || null,
        });
    };

    // Auto-translate function
    const handleAutoTranslate = async (targetLang: string) => {
        // Find source language (first language with content, preferring English)
        let sourceText = descriptions.en || "";
        let sourceLang = "en";

        if (!sourceText) {
            for (const lang of SUPPORTED_LANGUAGES) {
                if (descriptions[lang.code] && descriptions[lang.code]?.trim()) {
                    sourceText = descriptions[lang.code]!;
                    sourceLang = lang.code;
                    break;
                }
            }
        }

        if (!sourceText) {
            setTranslateError("No source text available to translate");
            return;
        }

        setIsTranslating(true);
        setTranslateError(null);
        setShowTranslateDropdown(false);

        try {
            setTranslateProgress(`Translating to ${SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name}...`);

            const response = await axios.post("/api/translate", {
                text: sourceText,
                targetLang,
                sourceLang,
            });

            const { translatedText } = response.data;

            if (translatedText) {
                // Update the target language description
                const newDescriptions = { ...descriptions };
                newDescriptions[targetLang] = translatedText;
                onChange(newDescriptions);
                setIsDirty(true);

                // Auto-switch to the translated tab
                setActiveTab(targetLang);
            }
        } catch (error: any) {
            console.error("[AutoTranslate] Error:", error);
            setTranslateError(error.response?.data?.error || "Translation failed");
        } finally {
            setIsTranslating(false);
            setTranslateProgress(null);
        }
    };

    // Translate all empty languages
    const handleTranslateAll = async () => {
        // Find source language (first language with content, preferring English)
        let sourceText = descriptions.en || "";
        let sourceLang = "en";

        if (!sourceText) {
            for (const lang of SUPPORTED_LANGUAGES) {
                if (descriptions[lang.code] && descriptions[lang.code]?.trim()) {
                    sourceText = descriptions[lang.code]!;
                    sourceLang = lang.code;
                    break;
                }
            }
        }

        if (!sourceText) {
            setTranslateError("No source text available to translate");
            return;
        }

        setIsTranslating(true);
        setTranslateError(null);
        setShowTranslateDropdown(false);

        try {
            const newDescriptions = { ...descriptions };

            for (const lang of SUPPORTED_LANGUAGES) {
                if (lang.code === sourceLang) continue; // Skip source language
                if (newDescriptions[lang.code]?.trim()) continue; // Skip already filled

                setTranslateProgress(`Translating to ${lang.name}...`);

                const response = await axios.post("/api/translate", {
                    text: sourceText,
                    targetLang: lang.code,
                    sourceLang,
                });

                const { translatedText } = response.data;
                if (translatedText) {
                    newDescriptions[lang.code] = translatedText;
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            onChange(newDescriptions);
            setIsDirty(true);
        } catch (error: any) {
            console.error("[AutoTranslate] Error:", error);
            setTranslateError(error.response?.data?.error || "Translation failed");
        } finally {
            setIsTranslating(false);
            setTranslateProgress(null);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowTranslateDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Check if at least one language has content
    const hasAtLeastOneDescription = Object.values(descriptions).some(
        (desc) => desc && desc.trim().length > 0
    );

    // Get content status for each language
    const getLanguageStatus = (langCode: string): "filled" | "empty" => {
        const desc = descriptions[langCode];
        return desc && desc.trim().length > 0 ? "filled" : "empty";
    };

    // Get languages that need translation
    const getLanguagesNeedingTranslation = () => {
        return SUPPORTED_LANGUAGES.filter(lang => !descriptions[lang.code]?.trim());
    };

    // Session persistence - restore last active tab
    useEffect(() => {
        const savedTab = sessionStorage.getItem("admin_ml_editor_tab");
        if (savedTab && SUPPORTED_LANGUAGES.find((l) => l.code === savedTab)) {
            setActiveTab(savedTab);
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem("admin_ml_editor_tab", activeTab);
    }, [activeTab]);

    // Auto-save indicator reset
    useEffect(() => {
        if (isDirty) {
            const timer = setTimeout(() => setIsDirty(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [descriptions]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-brand-yellow" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">
                        {labels.title || "Multi-Language Description"}
                    </span>
                </div>
                {required && !hasAtLeastOneDescription && (
                    <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-widest text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        {labels.atLeastOneRequired || "At least one language required"}
                    </div>
                )}
            </div>

            {/* Tabs with Translate Button */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Language Tabs */}
                <div className="flex-1 flex flex-wrap gap-1 bg-black/40 border border-white/5 rounded-sm p-1">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                        const status = getLanguageStatus(lang.code);
                        const isActive = activeTab === lang.code;

                        return (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => handleTabChange(lang.code)}
                                className={`
                                    relative flex items-center gap-2 px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest
                                    transition-all duration-200
                                    ${isActive
                                        ? "bg-brand-yellow text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                                        : "text-neutral-500 hover:text-white hover:bg-white/[0.03]"
                                    }
                                `}
                            >
                                <span className="text-sm">{lang.flag}</span>
                                <span>{lang.code.toUpperCase()}</span>

                                {/* Status Indicator */}
                                <span
                                    className={`
                                        w-2 h-2 rounded-full transition-all flex items-center justify-center
                                        ${status === "filled"
                                            ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"
                                            : "bg-neutral-700"
                                        }
                                        ${isActive ? "ml-1" : ""}
                                    `}
                                >
                                    {status === "filled" && (
                                        <Check className="w-2 h-2 text-black" />
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Translate Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                        disabled={isTranslating || !hasAtLeastOneDescription}
                        className="h-full px-4 py-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-sm text-[10px] font-black uppercase tracking-widest text-brand-yellow hover:bg-brand-yellow/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        {isTranslating ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {translateProgress || labels.translating || "Translating..."}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3 h-3" />
                                Auto-Translate
                            </>
                        )}
                    </button>

                    {showTranslateDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-[#0c0c0c] border border-white/10 rounded-sm shadow-2xl z-50 overflow-hidden">
                            <div className="p-3 border-b border-white/5">
                                <span className="text-[9px] uppercase font-black tracking-widest text-neutral-500">
                                    Translate to:
                                </span>
                            </div>
                            <div className="py-2 max-h-64 overflow-y-auto">
                                {getLanguagesNeedingTranslation().length > 0 ? (
                                    <>
                                        {getLanguagesNeedingTranslation().map((lang) => (
                                            <button
                                                key={lang.code}
                                                type="button"
                                                onClick={() => handleAutoTranslate(lang.code)}
                                                className="w-full text-left px-4 py-3 text-[11px] uppercase font-black tracking-widest text-neutral-400 hover:text-brand-yellow hover:bg-white/[0.03] transition-colors flex items-center gap-3"
                                            >
                                                <span className="text-lg">{lang.flag}</span>
                                                {lang.name}
                                            </button>
                                        ))}
                                        {getLanguagesNeedingTranslation().length > 1 && (
                                            <>
                                                <div className="my-2 border-t border-white/5" />
                                                <button
                                                    type="button"
                                                    onClick={handleTranslateAll}
                                                    className="w-full text-left px-4 py-3 text-[11px] uppercase font-black tracking-widest text-brand-yellow hover:bg-white/[0.03] transition-colors flex items-center gap-3"
                                                >
                                                    <Languages className="w-4 h-4" />
                                                    Translate All Missing
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="px-4 py-6 text-center">
                                        <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500">
                                            All languages filled
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {translateError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-sm flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                        {labels.translateError || translateError}
                    </span>
                </div>
            )}

            {/* Editor */}
            <div className="relative">
                <textarea
                    value={getDescription(activeTab)}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder={
                        labels.placeholder ||
                        `Enter description in ${SUPPORTED_LANGUAGES.find((l) => l.code === activeTab)?.name || activeTab}...`
                    }
                    rows={6}
                    disabled={isTranslating}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-sm p-4 text-xs font-medium text-neutral-300 focus:outline-none focus:border-brand-yellow/30 leading-relaxed resize-y transition-all disabled:opacity-50"
                />

                {/* Language Info Footer */}
                <div className="flex items-center justify-between mt-2 text-[9px] uppercase font-black tracking-widest">
                    <span className="text-neutral-600">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === activeTab)?.nativeName ||
                            activeTab}
                    </span>
                    <div className="flex items-center gap-4">
                        {isDirty && (
                            <span className="text-brand-yellow animate-pulse">Unsaved...</span>
                        )}
                        <span
                            className={
                                getDescription(activeTab).length > 0
                                    ? "text-green-400"
                                    : "text-neutral-700"
                            }
                        >
                            {getDescription(activeTab).length} chars
                        </span>
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Warning Modal */}
            {showUnsavedWarning && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-sm p-6 max-w-md w-full space-y-4">
                        <div className="flex items-center gap-3 text-brand-yellow">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-[10px] uppercase font-black tracking-widest">
                                Unsaved Changes
                            </span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                            {labels.unsavedChanges ||
                                "You have unsaved changes in the current language. Do you want to discard them?"}
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleCancelTabChange}
                                className="flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 border border-white/10 hover:bg-white/[0.03] rounded-sm transition-all"
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmTabChange}
                                className="flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-brand-yellow text-black hover:bg-brand-yellow/90 rounded-sm transition-all"
                            >
                                Discard & Switch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Responsive - Scrollable Tabs */}
            <style jsx global>{`
                @media (max-width: 640px) {
                    .flex.flex-wrap.gap-1 {
                        flex-wrap: nowrap;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                        padding-bottom: 4px;
                    }
                    .flex.flex-wrap.gap-1::-webkit-scrollbar {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
