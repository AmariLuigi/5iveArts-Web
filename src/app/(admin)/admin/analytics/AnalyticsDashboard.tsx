"use client";

import { useState, useCallback, useMemo } from "react";
import { useAnalyticsDashboard } from "@/hooks/useAnalyticsDashboard";
import {
    FunnelChart,
    MetricCard,
    LineChart,
    BarChart,
    PieChart,
    HeatmapChart,
    DataTable
} from "@/components/analytics/charts";
import {
    BarChart3,
    ShoppingCart,
    DollarSign,
    Users,
    Globe,
    Clock,
    Filter,
    Download,
    RefreshCw,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    AlertTriangle
} from "lucide-react";
import type { OverviewData } from "@/types/analytics";

interface DashboardCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

function DashboardCard({ title, children, className = "" }: DashboardCardProps) {
    return (
        <div className={`bg-neutral-900/30 border border-white/5 rounded-sm ${className}`}>
            <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-[10px] uppercase font-black tracking-widest text-neutral-400">
                    {title}
                </h3>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

interface LoadingSkeletonProps {
    height?: string;
}

function LoadingSkeleton({ height = "200px" }: LoadingSkeletonProps) {
    return (
        <div
            className="animate-pulse bg-neutral-800/50 rounded-sm"
            style={{ height }}
        />
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-3" />
            <p className="text-sm text-neutral-400 mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-brand-yellow/10 text-brand-yellow text-[10px] uppercase font-bold tracking-widest rounded-sm hover:bg-brand-yellow/20 transition-colors"
            >
                Try Again
            </button>
        </div>
    );
}

interface DateRangeOption {
    label: string;
    value: number;
}

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
    { label: "Last 7 days", value: 7 },
    { label: "Last 30 days", value: 30 },
    { label: "Last 90 days", value: 90 },
];

interface SectionToggleProps {
    activeSections: string[];
    onToggle: (section: string) => void;
}

function SectionToggle({ activeSections, onToggle }: SectionToggleProps) {
    const sections = [
        { id: "overview", label: "Overview" },
        { id: "funnel", label: "Funnel" },
        { id: "cart", label: "Cart" },
        { id: "conversion", label: "Conversion" },
        { id: "revenue", label: "Revenue" },
        { id: "users", label: "Users" },
        { id: "timepatterns", label: "Time Patterns" },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => onToggle(section.id)}
                    className={`px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-sm transition-colors
                        ${activeSections.includes(section.id)
                            ? "bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30"
                            : "bg-neutral-800/50 text-neutral-400 border border-white/5 hover:text-white"
                        }`}
                >
                    {section.label}
                </button>
            ))}
        </div>
    );
}

export default function AnalyticsDashboard() {
    const [days, setDays] = useState(30);
    const [activeSections, setActiveSections] = useState<string[]>(["overview", "funnel", "cart", "conversion", "revenue", "users", "timepatterns"]);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { data, loading, error, refetch, lastUpdated } = useAnalyticsDashboard({
        days,
        refreshInterval: autoRefresh ? 60000 : 0 // 1 minute when enabled
    });

    const handleToggleSection = useCallback((section: string) => {
        setActiveSections((prev) =>
            prev.includes(section)
                ? prev.filter((s) => s !== section)
                : [...prev, section]
        );
    }, []);

    const handleExport = useCallback(async () => {
        if (!data) return;

        setIsExporting(true);
        try {
            // Create CSV content
            const sections = [
                { name: "Funnel", data: data.funnel },
                { name: "Cart", data: [data.cart] },
                { name: "Revenue", data: [data.revenue] },
                { name: "Users", data: [data.users] },
            ];

            let csvContent = "5ive Arts Analytics Export\n";
            csvContent += `Generated: ${new Date().toISOString()}\n`;
            csvContent += `Date Range: Last ${days} days\n\n`;

            sections.forEach(({ name, data: sectionData }) => {
                csvContent += `${name}\n`;
                csvContent += JSON.stringify(sectionData, null, 2).replace(/,/g, ";") + "\n\n";
            });

            // Create and download file
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `analytics-export-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setIsExporting(false);
        }
    }, [data, days]);

    const shouldShowSection = useCallback((sectionId: string) => {
        return activeSections.includes(sectionId);
    }, [activeSections]);

    if (loading && !data) {
        return (
            <div className="p-8">
                <div className="mb-8">
                    <LoadingSkeleton height="60px" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <LoadingSkeleton key={i} height="120px" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LoadingSkeleton height="400px" />
                    <LoadingSkeleton height="400px" />
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-8">
                <ErrorState message={error} onRetry={refetch} />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                        Analytics Dashboard
                    </h1>
                    <p className="text-sm text-neutral-500">
                        Comprehensive e-commerce analytics and conversion insights
                    </p>
                    {lastUpdated && (
                        <p className="text-[10px] text-neutral-600 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Date Range */}
                    <div className="relative">
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="appearance-none bg-neutral-900 border border-white/10 text-[10px] uppercase font-bold 
                                tracking-widest text-neutral-300 px-4 py-2.5 pr-8 rounded-sm cursor-pointer
                                hover:border-brand-yellow/30 focus:border-brand-yellow/50 focus:outline-none transition-colors"
                        >
                            {DATE_RANGE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    </div>

                    {/* Auto Refresh Toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-sm text-[10px] uppercase font-bold tracking-widest transition-colors
                            ${autoRefresh
                                ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                : "bg-neutral-900 text-neutral-400 border border-white/10 hover:border-white/20"
                            }`}
                    >
                        <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} />
                        Live
                    </button>

                    {/* Export */}
                    <button
                        onClick={handleExport}
                        disabled={!data || isExporting}
                        className="flex items-center gap-2 px-3 py-2 bg-brand-yellow/10 text-brand-yellow 
                            text-[10px] uppercase font-bold tracking-widest rounded-sm 
                            hover:bg-brand-yellow/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        {isExporting ? "Exporting..." : "Export"}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={refetch}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-900 text-neutral-400 
                            text-[10px] uppercase font-bold tracking-widest rounded-sm border border-white/10
                            hover:border-white/20 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Section Toggle */}
            <SectionToggle activeSections={activeSections} onToggle={handleToggleSection} />

            {/* Overview Metrics */}
            {shouldShowSection("overview") && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Total Revenue"
                        value={data?.revenue.totalRevenue || 0}
                        change={data?.revenue.comparison.revenueChange}
                        changeLabel="vs prev period"
                        icon={<DollarSign className="w-4 h-4" />}
                        format="currency"
                    />
                    <MetricCard
                        title="Orders"
                        value={data?.revenue.orderCount || 0}
                        change={data?.revenue.comparison.countChange}
                        changeLabel="vs prev period"
                        icon={<ShoppingCart className="w-4 h-4" />}
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value={data?.funnel[data.funnel.length - 1]?.conversionFromStart || 0}
                        icon={<TrendingUp className="w-4 h-4" />}
                        format="percent"
                    />
                    <MetricCard
                        title="Avg Order Value"
                        value={data?.revenue.avgOrderValue || 0}
                        change={data?.revenue.comparison.aovChange}
                        changeLabel="vs prev period"
                        icon={<BarChart3 className="w-4 h-4" />}
                        format="currency"
                    />
                </div>
            )}

            {/* Funnel Section */}
            {shouldShowSection("funnel") && (
                <DashboardCard title="Conversion Funnel">
                    {data?.funnel ? (
                        <FunnelChart data={data.funnel} />
                    ) : (
                        <LoadingSkeleton height="350px" />
                    )}
                </DashboardCard>
            )}

            {/* Cart Behavior Section */}
            {shouldShowSection("cart") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Cart Metrics">
                        {data?.cart ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-neutral-900/50 p-4 rounded-sm">
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">
                                            Abandonment Rate
                                        </span>
                                        <span className="text-2xl font-black text-amber-400">
                                            {data.cart.abandonmentRate}%
                                        </span>
                                    </div>
                                    <div className="bg-neutral-900/50 p-4 rounded-sm">
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">
                                            Avg Cart Value
                                        </span>
                                        <span className="text-2xl font-black text-white">
                                            ${data.cart.avgCartValue}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[9px] uppercase font-bold text-neutral-500 mb-3">
                                        Cart Value Distribution
                                    </h4>
                                    <BarChart
                                        data={data.cart.cartValueDistribution}
                                        xKey="range"
                                        bars={[{ dataKey: "count", color: "#E5C100", name: "Orders" }]}
                                        height={200}
                                        horizontal
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <span className="text-xl font-black text-white">
                                            {data.cart.addToCart.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mt-1">
                                            Added to Cart
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xl font-black text-red-400">
                                            {data.cart.removeFromCart.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mt-1">
                                            Removed
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xl font-black text-amber-400">
                                            {data.cart.checkoutAbandoned.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mt-1">
                                            Abandoned Checkout
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <LoadingSkeleton height="350px" />
                        )}
                    </DashboardCard>

                    <DashboardCard title="Cart to Purchase Flow">
                        {data?.cart ? (
                            <PieChart
                                data={[
                                    { name: "Completed Purchase", value: data.cart.addToCart - data.cart.checkoutAbandoned },
                                    { name: "Abandoned Checkout", value: data.cart.checkoutAbandoned },
                                    { name: "Still in Cart", value: Math.max(0, data.cart.addToCart - data.cart.removeFromCart - (data.cart.addToCart - data.cart.checkoutAbandoned)) },
                                ]}
                                height={280}
                            />
                        ) : (
                            <LoadingSkeleton height="280px" />
                        )}
                    </DashboardCard>
                </div>
            )}

            {/* Conversion Analytics */}
            {shouldShowSection("conversion") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Conversion Rate Trend">
                        {data?.conversion.conversionTrend ? (
                            <LineChart
                                data={data.conversion.conversionTrend}
                                xKey="date"
                                lines={[
                                    { dataKey: "rate", color: "#E5C100", name: "Conversion Rate %" }
                                ]}
                                height={280}
                                formatYAxis={(v) => `${v}%`}
                            />
                        ) : (
                            <LoadingSkeleton height="280px" />
                        )}
                    </DashboardCard>

                    <DashboardCard title="Device Breakdown">
                        {data?.conversion.deviceBreakdown ? (
                            <div className="space-y-6">
                                <BarChart
                                    data={data.conversion.deviceBreakdown}
                                    xKey="device"
                                    bars={[
                                        { dataKey: "sessions", color: "#3B82F6", name: "Sessions" },
                                        { dataKey: "conversions", color: "#10B981", name: "Conversions" }
                                    ]}
                                    height={200}
                                />
                                <div className="space-y-2">
                                    {data.conversion.deviceBreakdown.map((device) => (
                                        <div key={device.device} className="flex items-center justify-between text-[11px]">
                                            <span className="text-neutral-400 capitalize">{device.device}</span>
                                            <span className="font-bold text-white">{device.rate}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <LoadingSkeleton height="280px" />
                        )}
                    </DashboardCard>
                </div>
            )}

            {shouldShowSection("conversion") && (
                <DashboardCard title="Traffic Sources">
                    {data?.conversion.trafficBreakdown ? (
                        <DataTable
                            data={data.conversion.trafficBreakdown}
                            columns={[
                                { key: "source", header: "Source", width: "40%" },
                                { key: "sessions", header: "Sessions", align: "right" },
                                { key: "conversions", header: "Conversions", align: "right" },
                                {
                                    key: "rate",
                                    header: "Rate",
                                    align: "right",
                                    render: (item: any) => (
                                        <span className="text-brand-yellow font-bold">{item.rate}%</span>
                                    )
                                }
                            ]}
                        />
                    ) : (
                        <LoadingSkeleton height="200px" />
                    )}
                </DashboardCard>
            )}

            {/* Revenue Analytics */}
            {shouldShowSection("revenue") && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DashboardCard title="Revenue Trend">
                            {data?.revenue.revenueTrend ? (
                                <LineChart
                                    data={data.revenue.revenueTrend}
                                    xKey="date"
                                    lines={[
                                        { dataKey: "revenue", color: "#10B981", name: "Revenue" }
                                    ]}
                                    height={200}
                                    formatYAxis={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                                />
                            ) : (
                                <LoadingSkeleton height="200px" />
                            )}
                        </DashboardCard>

                        <DashboardCard title="Revenue by Channel" className="md:col-span-2">
                            {data?.revenue.revenueByChannel ? (
                                <BarChart
                                    data={data.revenue.revenueByChannel.slice(0, 8)}
                                    xKey="channel"
                                    bars={[
                                        { dataKey: "revenue", color: "#E5C100", name: "Revenue" }
                                    ]}
                                    height={200}
                                    formatValue={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`}
                                />
                            ) : (
                                <LoadingSkeleton height="200px" />
                            )}
                        </DashboardCard>
                    </div>

                    <DashboardCard title="Revenue Comparison">
                        {data?.revenue.comparison ? (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                <div className="text-center">
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-2">
                                        Current Revenue
                                    </span>
                                    <span className="text-2xl font-black text-white">
                                        ${data.revenue.totalRevenue.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-2">
                                        Previous Revenue
                                    </span>
                                    <span className="text-2xl font-black text-neutral-400">
                                        ${data.revenue.comparison.prevRevenue.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-2">
                                        Revenue Change
                                    </span>
                                    <span className={`text-2xl font-black ${data.revenue.comparison.revenueChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {data.revenue.comparison.revenueChange >= 0 ? "+" : ""}
                                        {data.revenue.comparison.revenueChange}%
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-2">
                                        Current Orders
                                    </span>
                                    <span className="text-2xl font-black text-white">
                                        {data.revenue.orderCount}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-2">
                                        Previous Orders
                                    </span>
                                    <span className="text-2xl font-black text-neutral-400">
                                        {data.revenue.comparison.prevCount}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <LoadingSkeleton height="100px" />
                        )}
                    </DashboardCard>
                </>
            )}

            {/* User Segment Analysis */}
            {shouldShowSection("users") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Customer Segments">
                        {data?.users ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-neutral-900/50 rounded-sm">
                                        <span className="text-2xl font-black text-white">
                                            {data.users.totalCustomers}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mt-1">
                                            Total Customers
                                        </span>
                                    </div>
                                    <div className="text-center p-4 bg-neutral-900/50 rounded-sm">
                                        <span className="text-2xl font-black text-emerald-400">
                                            {data.users.newCustomers}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mt-1">
                                            New
                                        </span>
                                    </div>
                                    <div className="text-center p-4 bg-neutral-900/50 rounded-sm">
                                        <span className="text-2xl font-black text-blue-400">
                                            {data.users.returningCustomers}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-neutral-500 block mt-1">
                                            Returning
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[9px] uppercase font-bold text-neutral-500 mb-3">
                                        Purchase Frequency
                                    </h4>
                                    <PieChart
                                        data={data.users.purchaseFrequency.map((pf) => ({
                                            name: pf.label,
                                            value: pf.count
                                        }))}
                                        height={200}
                                    />
                                </div>
                            </div>
                        ) : (
                            <LoadingSkeleton height="350px" />
                        )}
                    </DashboardCard>

                    <DashboardCard title="Lifetime Value Distribution">
                        {data?.users ? (
                            <BarChart
                                data={data.users.ltvDistribution}
                                xKey="range"
                                bars={[
                                    { dataKey: "count", color: "#8B5CF6", name: "Customers" }
                                ]}
                                height={280}
                            />
                        ) : (
                            <LoadingSkeleton height="280px" />
                        )}
                    </DashboardCard>
                </div>
            )}

            {/* Geographic & Device Insights */}
            {data?.geographic && shouldShowSection("overview") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Geographic Performance">
                        <DataTable
                            data={data.geographic.regionBreakdown.slice(0, 10)}
                            columns={[
                                { key: "region", header: "Region", width: "40%" },
                                { key: "sessions", header: "Sessions", align: "right" },
                                { key: "conversions", header: "Conversions", align: "right" },
                                {
                                    key: "rate",
                                    header: "Rate",
                                    align: "right",
                                    render: (item: any) => (
                                        <span className={`font-bold ${item.rate >= 5 ? "text-emerald-400" : "text-amber-400"}`}>
                                            {item.rate}%
                                        </span>
                                    )
                                }
                            ]}
                        />
                    </DashboardCard>

                    <DashboardCard title="Browser Compatibility">
                        <DataTable
                            data={data.geographic.browserBreakdown}
                            columns={[
                                { key: "browser", header: "Browser", width: "40%" },
                                { key: "sessions", header: "Sessions", align: "right" },
                                { key: "conversions", header: "Conversions", align: "right" },
                                {
                                    key: "rate",
                                    header: "Rate",
                                    align: "right",
                                    render: (item: any) => (
                                        <span className="font-bold text-brand-yellow">
                                            {item.rate}%
                                        </span>
                                    )
                                }
                            ]}
                        />
                    </DashboardCard>
                </div>
            )}

            {/* Time-Based Patterns */}
            {shouldShowSection("timepatterns") && (
                <DashboardCard title="Temporal Patterns">
                    {data?.timepatterns ? (
                        <HeatmapChart
                            hourlyData={data.timepatterns.hourlyPatterns}
                            dailyData={data.timepatterns.dailyPatterns}
                        />
                    ) : (
                        <LoadingSkeleton height="350px" />
                    )}
                </DashboardCard>
            )}

            {/* Footer */}
            <div className="text-center py-8 border-t border-white/5">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    5ive Arts Analytics Dashboard • Data refreshes every {autoRefresh ? "minute" : "manual refresh"}
                </p>
            </div>
        </div>
    );
}
