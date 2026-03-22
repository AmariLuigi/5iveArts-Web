"use client";

import { FunnelStage } from "@/types/analytics";

interface FunnelChartProps {
    data: FunnelStage[];
    title?: string;
}

export default function FunnelChart({ data, title }: FunnelChartProps) {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-xs uppercase font-black tracking-widest text-neutral-400 mb-6">
                    {title}
                </h3>
            )}
            <div className="space-y-4">
                {data.map((stage, index) => {
                    const widthPercent = (stage.count / maxCount) * 100;
                    const isLast = index === data.length - 1;

                    return (
                        <div key={stage.stage} className="relative">
                            {/* Stage label */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-300">
                                    {stage.stage}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-white">
                                        {stage.count.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-brand-yellow">
                                        {stage.conversionFromStart}%
                                    </span>
                                </div>
                            </div>

                            {/* Funnel bar */}
                            <div className="relative h-12 bg-neutral-900 rounded-sm overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-yellow/20 to-brand-yellow/40 transition-all duration-700 ease-out"
                                    style={{ width: `${widthPercent}%` }}
                                />
                                <div className="absolute inset-0 flex items-center px-4">
                                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-yellow transition-all duration-700 ease-out"
                                            style={{ width: `${widthPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Drop-off rate */}
                            {!isLast && stage.dropOffRate > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-[9px] text-red-400/70">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                    <span>{stage.dropOffRate}% drop-off to next stage</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 block mb-1">
                            Overall Conversion
                        </span>
                        <span className="text-2xl font-black text-white">
                            {data.length > 0 ? data[data.length - 1].conversionFromStart : 0}%
                        </span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 block mb-1">
                            Biggest Drop-off
                        </span>
                        <span className="text-2xl font-black text-red-400">
                            {Math.max(...data.map(d => d.dropOffRate)).toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
