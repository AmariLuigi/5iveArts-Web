"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * High-Fidelity Copy to Clipboard Utility.
 */
export default function CopyButton({ text, className = "" }: { text: string, className?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy protocol failed", err);
        }
    };

    return (
        <button 
            onClick={handleCopy}
            className={`p-1.5 bg-white/5 border border-white/10 text-neutral-500 hover:text-white transition-all rounded-sm group/copy ${className}`}
            title="Copy to Clipboard"
        >
            {copied ? (
                <Check className="w-3 h-3 text-brand-yellow animate-in zoom-in duration-300" />
            ) : (
                <Copy className="w-3 h-3 group-hover/copy:scale-110 transition-transform" />
            )}
        </button>
    );
}
