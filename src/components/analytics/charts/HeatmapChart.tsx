"use client";

import { HourlyPattern, DailyPattern } from "@/types/analytics";

interface HeatmapChartProps {
    hourlyData: HourlyPattern[];
    dailyData: DailyPattern[];
    title?: string;
}

export default function HeatmapChart({ hourlyData, dailyData, title }: HeatmapChartProps) {
    // Find max values for normalization
    const maxSessions = Math.max(...hourlyData.map(h => h.sessions), 1);
    const maxRate = Math.max(...hourlyData.map(h => h.rate), 1);

    // Get color intensity based on value
    const getIntensity = (value: number, max: number): string => {
        const ratio = value / max;
        if (ratio === 0) return 'bg-neutral-900';
        if (ratio < 0.2) return 'bg-brand-yellow/10';
        if (ratio < 0.4) return 'bg-brand-yellow/25';
        if (ratio < 0.6) return 'bg-brand-yellow/40';
        if (ratio < 0.8) return 'bg-brand-yellow/60';
        return 'bg-brand-yellow/80';
    };

    const formatHour = (hour: number): string => {
        if (hour === 0) return '12am';
        if (hour === 12) return '12pm';
        return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
    };

    // Create a grid: days as rows, hours as columns
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // For simplicity, we'll show hourly patterns as a bar chart with intensity
    return (
        <div className="w-full">
            {title && (
                <h3 className="text-xs uppercase font-black tracking-widest text-neutral-400 mb-4">
                    {title}
                </h3>
            )}

            {/* Hourly Heatmap */}
            <div className="mb-8">
                <h4 className="text-[9px] uppercase font-bold text-neutral-500 mb-3">Hourly Activity</h4>
                <div className="grid grid-cols-12 gap-1">
                    {hourlyData.map((hour) => (
                        <div
                            key={hour.hour}
                            className={`aspect-square rounded-sm ${getIntensity(hour.sessions, maxSessions)} 
                                flex items-center justify-center cursor-pointer
                                border border-white/5 hover:border-brand-yellow/30 transition-colors
                                relative group`}
                            title={`${formatHour(hour.hour)}: ${hour.sessions} sessions, ${hour.rate}% conversion`}
                        >
                            <span className="text-[8px] text-neutral-500 rotate-90">
                                {hour.hour % 3 === 0 ? formatHour(hour.hour) : ''}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                                bg-neutral-900 border border-white/10 rounded-sm p-2 
                                opacity-0 group-hover:opacity-100 transition-opacity
                                pointer-events-none z-10 whitespace-nowrap">
                                <p className="text-[10px] font-bold text-white">{formatHour(hour.hour)}</p>
                                <p className="text-[9px] text-neutral-400">{hour.sessions} sessions</p>
                                <p className="text-[9px] text-brand-yellow">{hour.rate}% conversion</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-2">
                    <span className="text-[8px] text-neutral-500">Low</span>
                    <div className="flex gap-0.5">
                        <div className="w-3 h-3 bg-neutral-900 rounded-sm" />
                        <div className="w-3 h-3 bg-brand-yellow/10 rounded-sm" />
                        <div className="w-3 h-3 bg-brand-yellow/25 rounded-sm" />
                        <div className="w-3 h-3 bg-brand-yellow/40 rounded-sm" />
                        <div className="w-3 h-3 bg-brand-yellow/60 rounded-sm" />
                        <div className="w-3 h-3 bg-brand-yellow/80 rounded-sm" />
                    </div>
                    <span className="text-[8px] text-neutral-500">High</span>
                </div>
            </div>

            {/* Daily Pattern */}
            <div>
                <h4 className="text-[9px] uppercase font-bold text-neutral-500 mb-3">Day of Week</h4>
                <div className="flex gap-1">
                    {dayOrder.map((day) => {
                        const dayData = dailyData.find(d => d.day === day);
                        const sessions = dayData?.sessions || 0;

                        return (
                            <div
                                key={day}
                                className={`flex-1 h-16 rounded-sm ${getIntensity(sessions, maxSessions)} 
                                    flex flex-col items-center justify-end pb-1
                                    border border-white/5 hover:border-brand-yellow/30 transition-colors
                                    cursor-pointer relative group`}
                                title={`${day}: ${sessions} sessions`}
                            >
                                <span className="text-[8px] text-neutral-500 mb-1">
                                    {day.slice(0, 3)}
                                </span>
                                <div
                                    className="w-full bg-brand-yellow/40 rounded-t-sm transition-all"
                                    style={{ height: `${Math.max(4, (sessions / maxSessions) * 40)}px` }}
                                />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                                    bg-neutral-900 border border-white/10 rounded-sm p-2 
                                    opacity-0 group-hover:opacity-100 transition-opacity
                                    pointer-events-none z-10 whitespace-nowrap">
                                    <p className="text-[10px] font-bold text-white">{day}</p>
                                    <p className="text-[9px] text-neutral-400">{sessions} sessions</p>
                                    <p className="text-[9px] text-brand-yellow">{dayData?.rate || 0}% conversion</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Peak Times Summary */}
            <div className="mt-6 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">
                            Peak Hour
                        </span>
                        <span className="text-lg font-black text-white">
                            {formatHour(hourlyData.reduce((a, b) => a.sessions > b.sessions ? a : b).hour)}
                        </span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">
                            Best Day
                        </span>
                        <span className="text-lg font-black text-white">
                            {dailyData.reduce((a, b) => a.conversions > b.conversions ? a : b).day?.slice(0, 3)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
