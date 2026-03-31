"use client";

import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

interface BarConfig {
    dataKey: string;
    color?: string;
    name?: string;
}

interface BarChartProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    xKey: string;
    bars: BarConfig[];
    title?: string;
    height?: number;
    showGrid?: boolean;
    horizontal?: boolean;
    formatValue?: (value: number) => string;
}

const COLORS = [
    '#E5C100', // brand-yellow
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
];

const defaultFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
};

const CustomTooltip = ({ active, payload, label, formatValue }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-neutral-900 border border-white/10 rounded-sm p-3 shadow-xl">
            <p className="text-[10px] uppercase font-bold text-neutral-400 mb-2">
                {label}
            </p>
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-neutral-300">{entry.name || entry.dataKey}:</span>
                    <span className="font-bold text-white">
                        {formatValue ? formatValue(entry.value) : defaultFormatter(entry.value)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default function BarChart({
    data,
    xKey,
    bars,
    title,
    height = 300,
    showGrid = true,
    horizontal = false,
    formatValue
}: BarChartProps) {
    return (
        <div className="w-full">
            {title && (
                <h3 className="text-xs uppercase font-black tracking-widest text-neutral-400 mb-4">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <RechartsBarChart
                    data={data}
                    layout={horizontal ? "vertical" : "horizontal"}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            horizontal={!horizontal}
                            vertical={horizontal}
                        />
                    )}
                    {horizontal ? (
                        <>
                            <XAxis
                                type="number"
                                tick={{ fill: '#737373', fontSize: 10 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickFormatter={formatValue || defaultFormatter}
                            />
                            <YAxis
                                type="category"
                                dataKey={xKey}
                                tick={{ fill: '#737373', fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                width={80}
                            />
                        </>
                    ) : (
                        <>
                            <XAxis
                                dataKey={xKey}
                                tick={{ fill: '#737373', fontSize: 10 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            />
                            <YAxis
                                tick={{ fill: '#737373', fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatValue || defaultFormatter}
                                width={50}
                            />
                        </>
                    )}
                    <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
                    {bars.map((bar, index) => (
                        <Bar
                            key={bar.dataKey}
                            dataKey={bar.dataKey}
                            name={bar.name || bar.dataKey}
                            fill={bar.color || COLORS[index % COLORS.length]}
                            radius={[2, 2, 0, 0]}
                            maxBarSize={40}
                        >
                            {bar.dataKey === "rate" && data.map((_, idx) => (
                                <Cell
                                    key={`cell-${idx}`}
                                    fill={COLORS[idx % COLORS.length]}
                                    fillOpacity={0.6 + (0.4 * (data.length - idx) / data.length)}
                                />
                            ))}
                        </Bar>
                    ))}
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
}
