"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
    code: string;
    name: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    name?: string;
    disabled?: boolean;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    label,
    placeholder = "Select an option",
    name,
    disabled = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchString, setSearchString] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const selectedOption = options.find((opt) => opt.code === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        if (e.key === "Escape" || e.key === "Tab") {
            setIsOpen(false);
            return;
        }

        // Handle alphanumeric search
        if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
            e.preventDefault();

            const newSearchString = searchString + e.key.toLowerCase();
            setSearchString(newSearchString);

            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => setSearchString(""), 1000);

            const match = options.find(opt =>
                opt.name.toLowerCase().startsWith(newSearchString)
            );

            if (match) {
                const index = options.indexOf(match);
                const element = scrollRef.current?.children[index] as HTMLElement;
                if (element) {
                    element.scrollIntoView({ block: "nearest", behavior: "smooth" });
                }
            }
        }
    };

    return (
        <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
            {label && (
                <label className="block text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-2">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-[#050505] border border-white/5 rounded px-4 py-3 text-sm text-white flex items-center justify-between transition-all focus:outline-none focus:border-brand-yellow group ${disabled ? "opacity-30 cursor-not-allowed" : "hover:border-brand-yellow/30"
                    }`}
            >
                <span className={selectedOption ? "text-white" : "text-neutral-500"}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-neutral-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        } ${!disabled && "group-hover:text-brand-yellow"}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#0c0c0c] border border-white/10 rounded-sm shadow-2xl z-[100] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar" ref={scrollRef}>
                        {options.map((opt) => (
                            <button
                                key={opt.code}
                                type="button"
                                onClick={() => {
                                    onChange(opt.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/[0.05] transition-colors border-b border-white/5 last:border-0 group/item ${value === opt.code ? 'bg-brand-yellow/[0.03]' : ''
                                    }`}
                            >
                                <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${value === opt.code ? 'text-brand-yellow' : 'text-neutral-400 group-hover/item:text-white'
                                    }`}>
                                    {opt.name}
                                </span>
                                {value === opt.code && (
                                    <Check className="w-3.5 h-3.5 text-brand-yellow" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hidden input for form compatibility if needed */}
            <input type="hidden" name={name} value={value} />
        </div>
    );
}
