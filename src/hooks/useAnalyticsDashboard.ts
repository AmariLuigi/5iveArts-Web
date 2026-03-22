"use client";

import { useState, useEffect, useCallback } from "react";
import type { OverviewData } from "@/types/analytics";

interface UseAnalyticsOptions {
    days?: number;
    startDate?: string;
    endDate?: string;
    refreshInterval?: number; // in milliseconds, 0 to disable
}

interface UseAnalyticsReturn {
    data: OverviewData | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    lastUpdated: Date | null;
}

export function useAnalyticsDashboard(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
    const { days = 30, startDate, endDate, refreshInterval = 0 } = options;

    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);

            const params = new URLSearchParams();
            params.set('type', 'overview');
            params.set('days', days.toString());
            if (startDate) params.set('start', startDate);
            if (endDate) params.set('end', endDate);

            const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
            console.error('[useAnalyticsDashboard] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [days, startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh
    useEffect(() => {
        if (refreshInterval <= 0) return;

        const intervalId = setInterval(fetchData, refreshInterval);
        return () => clearInterval(intervalId);
    }, [fetchData, refreshInterval]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        lastUpdated
    };
}

// Individual data hooks for specific sections
export function useFunnelData(days: number = 30) {
    return useAnalyticsSection('funnel', days);
}

export function useCartData(days: number = 30) {
    return useAnalyticsSection('cart', days);
}

export function useConversionData(days: number = 30) {
    return useAnalyticsSection('conversion', days);
}

export function useRevenueData(days: number = 30) {
    return useAnalyticsSection('revenue', days);
}

export function useUserSegmentData(days: number = 30) {
    return useAnalyticsSection('users', days);
}

export function useGeographicData(days: number = 30) {
    return useAnalyticsSection('geographic', days);
}

export function useTimePatternsData(days: number = 30) {
    return useAnalyticsSection('timepatterns', days);
}

function useAnalyticsSection<T>(type: string, days: number) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);

            const params = new URLSearchParams();
            params.set('type', type);
            params.set('days', days.toString());

            const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${type} data: ${response.statusText}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to fetch ${type} data`);
            console.error(`[use${type}Data] Error:`, err);
        } finally {
            setLoading(false);
        }
    }, [type, days]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
