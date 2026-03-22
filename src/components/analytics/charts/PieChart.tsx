"use client";

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DataPoint {
    name: string;
    value: number;
    [key: string]: string | number;
}

interface PieChartProps {
    data: DataPoint[];
    title?: string;
    height?: number;
    colors?: string[];
    showLabels?: boolean;
    showLegend?: boolean;
    formatValue?: (value: number) => string;
}

const DEFAULT_COLORS = [
    '#E5C100', // brand-yellow
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
];

export default function PieChart({
    data,
    title,
    height = 300,
    colors = DEFAULT_COLORS,
    showLabels = true,
    showLegend = true,
    formatValue
}: PieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const defaultFormatter = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toString();
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;
        const item = payload[0].payload;

        return (
            <div className="bg-neutral-900 border border-white/10 rounded-sm p-3 shadow-xl">
                <p className="text-[10px] uppercase font-bold text-neutral-400 mb-1">
                    {item.name}
                </p>
                <p className="text-lg font-black text-white">
                    {formatValue ? formatValue(item.value) : defaultFormatter(item.value)}
                </p>
                <p className="text-[10px] text-neutral-400">
                    {((item.value / total) * 100).toFixed(1)}% of total
                </p>
            </div>
        );
    };

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (!showLabels) return null;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text
                x={x}
                y={y}
                fill="#000"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-xs uppercase font-black tracking-widest text-neutral-400 mb-4">
                    {title}
                </h3>
            )}
            <div className="flex items-center gap-6">
                <div style={{ width: '100%', height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius="70%"
                                innerRadius="40%"
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                        stroke="none"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>

                {showLegend && (
                    <div className="flex flex-col gap-2 min-w-[120px]">
                        {data.slice(0, 6).map((item, index) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="text-[10px] text-neutral-400 truncate max-w-[80px]">
                                    {item.name}
                                </span>
                                <span className="text-[10px] font-bold text-white ml-auto">
                                    {((item.value / total) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                        {data.length > 6 && (
                            <span className="text-[9px] text-neutral-500 mt-1">
                                +{data.length - 6} more
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
