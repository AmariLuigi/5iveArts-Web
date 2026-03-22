"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    format?: "number" | "currency" | "percent";
}

export default function MetricCard({
    title,
    value,
    change,
    changeLabel,
    icon,
    format = "number"
}: MetricCardProps) {
    const formattedValue = () => {
        if (typeof value === "string") return value;
        switch (format) {
            case "currency":
                return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(value);
            case "percent":
                return `${value.toFixed(1)}%`;
            default:
                return value.toLocaleString();
        }
    };

    const getTrendIcon = () => {
        if (change === undefined || change === 0) {
            return <Minus className="w-3 h-3" />;
        }
        return change > 0 ? (
            <TrendingUp className="w-3 h-3" />
        ) : (
            <TrendingDown className="w-3 h-3" />
        );
    };

    const getTrendColor = () => {
        if (change === undefined || change === 0) return "text-neutral-400";
        return change > 0 ? "text-emerald-400" : "text-red-400";
    };

    return (
        <div className="bg-neutral-900/50 border border-white/5 rounded-sm p-6 hover:border-brand-yellow/20 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <span className="text-[9px] uppercase font-black tracking-widest text-neutral-500">
                    {title}
                </span>
                {icon && (
                    <div className="w-8 h-8 bg-brand-yellow/10 rounded-sm flex items-center justify-center text-brand-yellow">
                        {icon}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <span className="text-3xl font-black text-white tracking-tight">
                    {formattedValue()}
                </span>

                {change !== undefined && (
                    <div className={`flex items-center gap-1.5 ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="text-[10px] font-bold">
                            {change > 0 ? "+" : ""}{change.toFixed(1)}%
                        </span>
                        {changeLabel && (
                            <span className="text-[9px] text-neutral-500 ml-1">
                                {changeLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
