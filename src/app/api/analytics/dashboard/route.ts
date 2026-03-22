import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/auth";
import type {
    AnalyticsEvent,
    FunnelStage,
    CartBehaviorMetrics,
    ConversionData,
    RevenueData,
    UserSegmentData,
    GeographicData,
    TimePatterns,
    OverviewData
} from "@/types/analytics";

const RATE_LIMIT = { limit: 100, windowMs: 60_000 };


function getDateRange(days: number = 30) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start: start.toISOString(), end: end.toISOString() };
}

// ── Funnel Analytics ────────────────────────────────────────────────────────
async function getFunnelData(startDate: string, endDate: string): Promise<FunnelStage[]> {
    const supabase = getSupabaseAdmin();

    const stages = [
        { name: 'Cart Add', event: 'add_to_cart' },
        { name: 'Checkout Initiated', event: 'checkout_step_1' },
        { name: 'Payment Entry', event: 'checkout_step_3' },
        { name: 'Order Completed', event: 'checkout_complete' }
    ];

    const funnelData: FunnelStage[] = [];

    for (const stage of stages) {
        const { count } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', stage.event)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        funnelData.push({
            stage: stage.name,
            event: stage.event,
            count: count || 0,
            dropOffRate: 0,
            conversionFromStart: 0,
            previousCount: 0
        });
    }

    // Calculate rates
    return funnelData.map((item, index) => {
        const previousCount = index > 0 ? funnelData[index - 1].count : item.count;
        const dropOffRate = previousCount > 0
            ? ((previousCount - item.count) / previousCount) * 100
            : 0;
        const conversionFromStart = funnelData[0].count > 0
            ? (item.count / funnelData[0].count) * 100
            : 0;

        return {
            ...item,
            dropOffRate: Math.round(dropOffRate * 10) / 10,
            conversionFromStart: Math.round(conversionFromStart * 10) / 10,
            previousCount
        };
    });
}

// ── Cart Behavior Analytics ─────────────────────────────────────────────────
async function getCartBehaviorData(startDate: string, endDate: string): Promise<CartBehaviorMetrics> {
    const supabase = getSupabaseAdmin();

    const { count: addToCart } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'add_to_cart')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    const { count: removeFromCart } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'remove_from_cart')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    const { count: checkoutAbandoned } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'checkout_abandoned')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    const { count: cartViewed } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'cart_viewed')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    const addCount = addToCart || 0;
    const removeCount = removeFromCart || 0;
    const abandonmentRate = addCount > 0 ? (removeCount / addCount) * 100 : 0;
    const checkoutAbandonmentRate = cartViewed && cartViewed > 0
        ? ((checkoutAbandoned || 0) / cartViewed) * 100
        : 0;

    // Get cart value distribution
    const { data: cartValueData } = await supabase
        .from('analytics_events')
        .select('event_data')
        .in('event_type', ['add_to_cart', 'remove_from_cart'])
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    const cartValues: number[] = [];
    cartValueData?.forEach((e: any) => {
        const val = e.event_data?.cart_total || e.event_data?.total;
        if (typeof val === 'number') cartValues.push(val);
    });

    const avgCartValue = cartValues.length > 0
        ? cartValues.reduce((a, b) => a + b, 0) / cartValues.length
        : 0;

    const buckets = [
        { range: '$0-25', min: 0, max: 25, count: 0 },
        { range: '$25-50', min: 25, max: 50, count: 0 },
        { range: '$50-100', min: 50, max: 100, count: 0 },
        { range: '$100-200', min: 100, max: 200, count: 0 },
        { range: '$200+', min: 200, max: Infinity, count: 0 }
    ];

    cartValues.forEach(val => {
        const bucket = buckets.find(b => val >= b.min && val < b.max);
        if (bucket) bucket.count++;
    });

    return {
        addToCart: addCount,
        removeFromCart: removeCount,
        cartViewed: cartViewed || 0,
        checkoutAbandoned: checkoutAbandoned || 0,
        abandonmentRate: Math.round(abandonmentRate * 10) / 10,
        checkoutAbandonmentRate: Math.round(checkoutAbandonmentRate * 10) / 10,
        avgCartValue: Math.round(avgCartValue * 100) / 100,
        cartValueDistribution: buckets.map(b => ({ range: b.range, count: b.count }))
    };
}

// ── Conversion Analytics ────────────────────────────────────────────────────
async function getConversionData(startDate: string, endDate: string): Promise<ConversionData> {
    const supabase = getSupabaseAdmin();

    const { data: dailyData } = await supabase
        .from('analytics_events')
        .select('event_type, created_at, session_id, event_data')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true }) as { data: AnalyticsEvent[] | null };

    const dailyConversions: Record<string, { sessions: Set<string>, conversions: Set<string> }> = {};

    dailyData?.forEach((event: AnalyticsEvent) => {
        const date = event.created_at.split('T')[0];
        if (!dailyConversions[date]) {
            dailyConversions[date] = { sessions: new Set(), conversions: new Set() };
        }
        dailyConversions[date].sessions.add(event.session_id);
        if (event.event_type === 'checkout_complete') {
            dailyConversions[date].conversions.add(event.session_id);
        }
    });

    const conversionTrend = Object.entries(dailyConversions).map(([date, data]) => ({
        date,
        sessions: data.sessions.size,
        conversions: data.conversions.size,
        rate: data.sessions.size > 0
            ? Math.round((data.conversions.size / data.sessions.size) * 10000) / 100
            : 0
    }));

    // Device breakdown
    const devices: Record<string, { sessions: Set<string>, conversions: Set<string> }> = {};

    dailyData?.forEach((event: AnalyticsEvent) => {
        const device = event.event_data?.device_type || 'unknown';
        if (!devices[device]) {
            devices[device] = { sessions: new Set(), conversions: new Set() };
        }
        devices[device].sessions.add(event.session_id);
        if (event.event_type === 'checkout_complete') {
            devices[device].conversions.add(event.session_id);
        }
    });

    const deviceBreakdown = Object.entries(devices).map(([device, data]) => ({
        device,
        sessions: data.sessions.size,
        conversions: data.conversions.size,
        rate: data.sessions.size > 0
            ? Math.round((data.conversions.size / data.sessions.size) * 10000) / 100
            : 0
    }));

    // Traffic source
    const trafficSources: Record<string, { sessions: number, conversions: number }> = {};

    dailyData?.forEach((event: AnalyticsEvent) => {
        const source = event.event_data?.utm_source ||
            (event.event_data?.referrer ? 'direct' : 'unknown');
        if (!trafficSources[source]) {
            trafficSources[source] = { sessions: 0, conversions: 0 };
        }
        if (event.event_type === 'add_to_cart') {
            trafficSources[source].sessions++;
        }
        if (event.event_type === 'checkout_complete') {
            trafficSources[source].conversions++;
        }
    });

    const trafficBreakdown = Object.entries(trafficSources)
        .map(([source, data]) => ({
            source,
            ...data,
            rate: data.sessions > 0
                ? Math.round((data.conversions / data.sessions) * 10000) / 100
                : 0
        }))
        .filter(s => s.source !== 'unknown')
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);

    return { conversionTrend, deviceBreakdown, trafficBreakdown };
}

// ── Revenue Analytics ────────────────────────────────────────────────────────
async function getRevenueData(startDate: string, endDate: string, days: number): Promise<RevenueData> {
    const supabase = getSupabaseAdmin();

    const { data: completedOrders } = await supabase
        .from('analytics_events')
        .select('event_type, created_at, event_data')
        .eq('event_type', 'checkout_complete')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true }) as { data: AnalyticsEvent[] | null };

    const dailyRevenue: Record<string, number> = {};
    let totalRevenue = 0;
    let orderCount = 0;

    completedOrders?.forEach((order: AnalyticsEvent) => {
        const date = order.created_at.split('T')[0];
        const revenue = order.event_data?.order_total || order.event_data?.total || 0;
        dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
        totalRevenue += revenue;
        orderCount++;
    });

    const revenueTrend = Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100
    }));

    // Previous period
    const periodLength = days;
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - periodLength);
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const { data: prevOrders } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'checkout_complete')
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', prevEnd.toISOString()) as { data: AnalyticsEvent[] | null };

    const prevRevenue = prevOrders?.reduce((sum: number, o: AnalyticsEvent) =>
        sum + (o.event_data?.order_total || o.event_data?.total || 0), 0) || 0;
    const prevCount = prevOrders?.length || 0;

    const revenueChange = prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : 0;
    const countChange = prevCount > 0
        ? ((orderCount - prevCount) / prevCount) * 100
        : 0;

    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const prevAvgOrderValue = prevCount > 0 ? prevRevenue / prevCount : 0;
    const aovChange = prevAvgOrderValue > 0
        ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
        : 0;

    // Channel attribution
    const channelRevenue: Record<string, number> = {};
    completedOrders?.forEach((order: AnalyticsEvent) => {
        const channel = order.event_data?.utm_source ||
            order.event_data?.channel || 'direct';
        const revenue = order.event_data?.order_total || order.event_data?.total || 0;
        channelRevenue[channel] = (channelRevenue[channel] || 0) + revenue;
    });

    const revenueByChannel = Object.entries(channelRevenue)
        .map(([channel, revenue]) => ({ channel, revenue: Math.round(revenue * 100) / 100 }))
        .sort((a, b) => b.revenue - a.revenue);

    return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        orderCount,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        revenueTrend,
        revenueByChannel,
        comparison: {
            revenueChange: Math.round(revenueChange * 10) / 10,
            countChange: Math.round(countChange * 10) / 10,
            aovChange: Math.round(aovChange * 10) / 10,
            prevRevenue: Math.round(prevRevenue * 100) / 100,
            prevCount: prevCount
        }
    };
}

// ── User Segment Analytics ──────────────────────────────────────────────────
async function getUserSegmentData(startDate: string, endDate: string): Promise<UserSegmentData> {
    const supabase = getSupabaseAdmin();

    const { data: userEvents } = await supabase
        .from('analytics_events')
        .select('user_id, event_type, created_at, event_data')
        .gte('created_at', startDate)
        .lte('created_at', endDate) as { data: AnalyticsEvent[] | null };

    const userPurchases: Record<string, number> = {};
    const userSessions: Record<string, Set<string>> = {};
    const userFirstPurchase: Record<string, string> = {};
    const userLastPurchase: Record<string, string> = {};

    userEvents?.forEach((event: AnalyticsEvent) => {
        if (!event.user_id) return;

        if (!userSessions[event.user_id]) {
            userSessions[event.user_id] = new Set();
        }
        userSessions[event.user_id].add(event.session_id);

        if (event.event_type === 'checkout_complete') {
            userPurchases[event.user_id] = (userPurchases[event.user_id] || 0) + 1;
            const date = event.created_at;
            if (!userFirstPurchase[event.user_id]) {
                userFirstPurchase[event.user_id] = date;
            }
            userLastPurchase[event.user_id] = date;
        }
    });

    const ltvValues = Object.values(userPurchases);
    const avgLTV = ltvValues.length > 0
        ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length
        : 0;

    const ltvDistribution = [
        { range: '1 purchase', min: 1, max: 1, count: 0 },
        { range: '2-3 purchases', min: 2, max: 3, count: 0 },
        { range: '4-5 purchases', min: 4, max: 5, count: 0 },
        { range: '6-10 purchases', min: 6, max: 10, count: 0 },
        { range: '10+ purchases', min: 11, max: Infinity, count: 0 }
    ];

    ltvValues.forEach(purchases => {
        const bucket = ltvDistribution.find(b => purchases >= b.min && purchases <= b.max);
        if (bucket) bucket.count++;
    });

    const purchaseFrequencies = Object.values(userPurchases);
    const freqDistribution = [
        { label: 'One-time', count: 0 },
        { label: 'Repeat (2-3)', count: 0 },
        { label: 'Frequent (4+)', count: 0 }
    ];

    purchaseFrequencies.forEach(freq => {
        if (freq === 1) freqDistribution[0].count++;
        else if (freq <= 3) freqDistribution[1].count++;
        else freqDistribution[2].count++;
    });

    const authenticatedUsers = new Set(Object.keys(userPurchases));
    const { data: allUserEvents } = await supabase
        .from('analytics_events')
        .select('user_id, created_at')
        .not('user_id', 'is', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate) as { data: AnalyticsEvent[] | null };

    const userFirstSeen: Record<string, string> = {};
    allUserEvents?.forEach((event: AnalyticsEvent) => {
        if (!userFirstSeen[event.user_id!]) {
            userFirstSeen[event.user_id!] = event.created_at;
        }
    });

    const newUsers = Object.keys(userFirstSeen).filter(uid =>
        new Date(userFirstSeen[uid]) >= new Date(startDate)
    ).length;

    const returningUsers = authenticatedUsers.size - newUsers;

    return {
        totalCustomers: authenticatedUsers.size,
        newCustomers: newUsers,
        returningCustomers: Math.max(0, returningUsers),
        avgLifetimeValue: Math.round(avgLTV * 100) / 100,
        ltvDistribution: ltvDistribution.map(d => ({ range: d.range, count: d.count })),
        purchaseFrequency: freqDistribution,
        sessionDistribution: Object.entries(userSessions).map(([userId, sessions]) => ({
            userId,
            sessionCount: sessions.size
        })).sort((a, b) => b.sessionCount - a.sessionCount).slice(0, 20)
    };
}

// ── Geographic & Device Analytics ──────────────────────────────────────────
async function getGeographicData(startDate: string, endDate: string): Promise<GeographicData> {
    const supabase = getSupabaseAdmin();

    const { data: geoEvents } = await supabase
        .from('analytics_events')
        .select('event_type, created_at, event_data')
        .gte('created_at', startDate)
        .lte('created_at', endDate) as { data: AnalyticsEvent[] | null };

    const regionData: Record<string, { sessions: number, conversions: number }> = {};

    geoEvents?.forEach((event: AnalyticsEvent) => {
        const region = event.event_data?.region ||
            event.event_data?.country ||
            event.event_data?.geo ||
            'Unknown';

        if (!regionData[region]) {
            regionData[region] = { sessions: 0, conversions: 0 };
        }

        if (event.event_type === 'add_to_cart') {
            regionData[region].sessions++;
        }
        if (event.event_type === 'checkout_complete') {
            regionData[region].conversions++;
        }
    });

    const regionBreakdown = Object.entries(regionData)
        .map(([region, data]) => ({
            region,
            sessions: data.sessions,
            conversions: data.conversions,
            rate: data.sessions > 0
                ? Math.round((data.conversions / data.sessions) * 10000) / 100
                : 0
        }))
        .filter(r => r.region !== 'Unknown')
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 15);

    const browserData: Record<string, { sessions: number, conversions: number }> = {};

    geoEvents?.forEach((event: AnalyticsEvent) => {
        const browser = event.event_data?.browser ||
            event.event_data?.user_agent ||
            'Unknown';

        if (!browserData[browser]) {
            browserData[browser] = { sessions: 0, conversions: 0 };
        }

        if (event.event_type === 'add_to_cart') {
            browserData[browser].sessions++;
        }
        if (event.event_type === 'checkout_complete') {
            browserData[browser].conversions++;
        }
    });

    const browserBreakdown = Object.entries(browserData)
        .map(([browser, data]) => ({
            browser,
            sessions: data.sessions,
            conversions: data.conversions,
            rate: data.sessions > 0
                ? Math.round((data.conversions / data.sessions) * 10000) / 100
                : 0
        }))
        .filter(b => b.browser !== 'Unknown')
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);

    return { regionBreakdown, browserBreakdown };
}

// ── Time-Based Pattern Analytics ────────────────────────────────────────────
async function getTimePatterns(startDate: string, endDate: string): Promise<TimePatterns> {
    const supabase = getSupabaseAdmin();

    const { data: timeEvents } = await supabase
        .from('analytics_events')
        .select('event_type, created_at, session_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate) as { data: AnalyticsEvent[] | null };

    const hourlyData: Record<number, { sessions: Set<string>, conversions: number }> = {};
    for (let h = 0; h < 24; h++) {
        hourlyData[h] = { sessions: new Set(), conversions: 0 };
    }

    const dailyData: Record<string, { sessions: Set<string>, conversions: number }> = {
        'Sunday': { sessions: new Set(), conversions: 0 },
        'Monday': { sessions: new Set(), conversions: 0 },
        'Tuesday': { sessions: new Set(), conversions: 0 },
        'Wednesday': { sessions: new Set(), conversions: 0 },
        'Thursday': { sessions: new Set(), conversions: 0 },
        'Friday': { sessions: new Set(), conversions: 0 },
        'Saturday': { sessions: new Set(), conversions: 0 }
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    timeEvents?.forEach((event: AnalyticsEvent) => {
        const date = new Date(event.created_at);
        const hour = date.getUTCHours();
        const day = dayNames[date.getUTCDay()];

        if (event.event_type === 'add_to_cart') {
            hourlyData[hour].sessions.add(event.session_id);
            dailyData[day].sessions.add(event.session_id);
        }
        if (event.event_type === 'checkout_complete') {
            hourlyData[hour].conversions++;
            dailyData[day].conversions++;
        }
    });

    const hourlyPatterns = Object.entries(hourlyData).map(([hour, data]) => ({
        hour: parseInt(hour),
        sessions: data.sessions.size,
        conversions: data.conversions,
        rate: data.sessions.size > 0
            ? Math.round((data.conversions / data.sessions.size) * 10000) / 100
            : 0
    }));

    const dailyPatterns = Object.entries(dailyData).map(([day, data]) => ({
        day,
        sessions: data.sessions.size,
        conversions: data.conversions,
        rate: data.sessions.size > 0
            ? Math.round((data.conversions / data.sessions.size) * 10000) / 100
            : 0
    }));

    const weeklyData: Record<string, { sessions: Set<string>, conversions: number }> = {
        'Week 1': { sessions: new Set(), conversions: 0 },
        'Week 2': { sessions: new Set(), conversions: 0 },
        'Week 3': { sessions: new Set(), conversions: 0 },
        'Week 4': { sessions: new Set(), conversions: 0 }
    };

    timeEvents?.forEach((event: AnalyticsEvent) => {
        const date = new Date(event.created_at);
        const week = Math.min(4, Math.floor(date.getUTCDate() / 7)) + 1;
        const weekKey = `Week ${week}`;

        if (event.event_type === 'add_to_cart') {
            weeklyData[weekKey].sessions.add(event.session_id);
        }
        if (event.event_type === 'checkout_complete') {
            weeklyData[weekKey].conversions++;
        }
    });

    const weeklyPatterns = Object.entries(weeklyData).map(([week, data]) => ({
        week,
        sessions: data.sessions.size,
        conversions: data.conversions,
        rate: data.sessions.size > 0
            ? Math.round((data.conversions / data.sessions.size) * 10000) / 100
            : 0
    }));

    return { hourlyPatterns, dailyPatterns, weeklyPatterns };
}

// ── Main Handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response!;

    const ip = getClientIp(req);
    const rl = checkRateLimit(`analytics-dashboard:${ip}`, RATE_LIMIT);

    if (!rl.success) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please slow down." },
            { status: 429 }
        );
    }


    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = searchParams.get('start') || getDateRange(days).start;
    const endDate = searchParams.get('end') || getDateRange(days).end;

    try {
        switch (type) {
            case 'funnel':
                return NextResponse.json(await getFunnelData(startDate, endDate));

            case 'cart':
                return NextResponse.json(await getCartBehaviorData(startDate, endDate));

            case 'conversion':
                return NextResponse.json(await getConversionData(startDate, endDate));

            case 'revenue':
                return NextResponse.json(await getRevenueData(startDate, endDate, days));

            case 'users':
                return NextResponse.json(await getUserSegmentData(startDate, endDate));

            case 'geographic':
                return NextResponse.json(await getGeographicData(startDate, endDate));

            case 'timepatterns':
                return NextResponse.json(await getTimePatterns(startDate, endDate));

            case 'overview':
            default: {
                const [funnel, cart, conversion, revenue, users, geographic, timepatterns] = await Promise.all([
                    getFunnelData(startDate, endDate),
                    getCartBehaviorData(startDate, endDate),
                    getConversionData(startDate, endDate),
                    getRevenueData(startDate, endDate, days),
                    getUserSegmentData(startDate, endDate),
                    getGeographicData(startDate, endDate),
                    getTimePatterns(startDate, endDate)
                ]);

                const overview: OverviewData = {
                    funnel,
                    cart,
                    conversion,
                    revenue,
                    users,
                    geographic,
                    timepatterns,
                    meta: { days, startDate, endDate }
                };

                return NextResponse.json(overview);
            }
        }
    } catch (err: any) {
        console.error('[analytics-dashboard] Error:', err.message);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
