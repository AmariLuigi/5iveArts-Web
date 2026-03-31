"use client";

import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

interface LineConfig {
    dataKey: string;
    color?: string;
    name?: string;
}

interface LineChartProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    xKey: string;
    lines: LineConfig[];
    title?: string;
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    formatYAxis?: (value: number) => string;
}

const defaultFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
};

const CustomTooltip = ({ active, payload, label, formatYAxis }: any) => {
    if (!active || !payload) return null;

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
                        {typeof entry.value === "number"
                            ? formatYAxis ? formatYAxis(entry.value) : defaultFormatter(entry.value)
                            : entry.value
                        }
                    </span>
                </div>
            ))}
        </div>
    );
};

export default function LineChart({
    data,
    xKey,
    lines,
    title,
    height = 300,
    showGrid = true,
    showLegend = false,
    formatYAxis
}: LineChartProps) {
    return (
        <div className="w-full">
            {title && (
                <h3 className="text-xs uppercase font-black tracking-widest text-neutral-400 mb-4">
                    {title}
                </h3>
            )}
            <ResponsiveContainer width="100%" height={height}>
                <RechartsLineChart
                    data={data}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                    {showGrid && (
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            vertical={false}
                        />
                    )}
                    <XAxis
                        dataKey={xKey}
                        tick={{ fill: '#737373', fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                    />
                    <YAxis
                        tick={{ fill: '#737373', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxis || defaultFormatter}
                        width={50}
                    />
                    <Tooltip content={<CustomTooltip formatYAxis={formatYAxis} />} />
                    {showLegend && (
                        <Legend
                            verticalAlign="top"
                            height={36}
                            formatter={(value) => (
                                <span className="text-[10px] uppercase text-neutral-400">{value}</span>
                            )}
                        />
                    )}
                    {lines.map((line, index) => (
                        <Line
                            key={line.dataKey}
                            type="monotone"
                            dataKey={line.dataKey}
                            name={line.name || line.dataKey}
                            stroke={line.color || `hsl(${45 + index * 45}, 80%, 50%)`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                                r: 4,
                                fill: line.color || '#E5C100',
                                stroke: '#000',
                                strokeWidth: 2
                            }}
                        />
                    ))}
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    );
}
