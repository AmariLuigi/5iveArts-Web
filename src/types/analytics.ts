// Analytics event types matching the database schema
export interface AnalyticsEvent {
    id: string;
    session_id: string;
    user_id: string | null;
    event_type: EventType;
    event_data: EventData;
    created_at: string;
}

export type EventType =
    | 'product_viewed'
    | 'variant_selected'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'cart_viewed'
    | 'checkout_step_1'
    | 'checkout_step_2'
    | 'checkout_step_3'
    | 'checkout_complete'
    | 'checkout_abandoned'
    | 'checkout_address_error'
    | 'courier_selected'
    | 'payment_failed'
    | 'payment_success'
    | 'payment_gateway_error';

export interface EventData {
    // UTM and referrer
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    referrer?: string;

    // Device info
    device_type?: 'mobile' | 'desktop' | 'tablet';
    locale?: string;
    browser?: string;
    user_agent?: string;

    // Cart/order info
    cart_total?: number;
    total?: number;
    order_total?: number;
    product_id?: string;
    product_name?: string;
    quantity?: number;
    variant_id?: string;

    // Geographic
    country?: string;
    region?: string;
    geo?: string;

    // Checkout
    step?: number;
    last_step?: string;
    last_seen_at?: string;

    // Channel attribution
    channel?: string;
}

// API Response Types
export interface FunnelStage {
    stage: string;
    event: string;
    count: number;
    dropOffRate: number;
    conversionFromStart: number;
    previousCount: number;
}

export interface CartBehaviorMetrics {
    addToCart: number;
    removeFromCart: number;
    cartViewed: number;
    checkoutAbandoned: number;
    abandonmentRate: number;
    checkoutAbandonmentRate: number;
    avgCartValue: number;
    cartValueDistribution: { range: string; count: number }[];
}

export interface ConversionTrend {
    date: string;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface DeviceBreakdown {
    device: string;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface TrafficBreakdown {
    source: string;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface ConversionData {
    conversionTrend: ConversionTrend[];
    deviceBreakdown: DeviceBreakdown[];
    trafficBreakdown: TrafficBreakdown[];
}

export interface RevenueTrend {
    date: string;
    revenue: number;
}

export interface ChannelRevenue {
    channel: string;
    revenue: number;
}

export interface RevenueComparison {
    revenueChange: number;
    countChange: number;
    aovChange: number;
    prevRevenue: number;
    prevCount: number;
}

export interface RevenueData {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    revenueTrend: RevenueTrend[];
    revenueByChannel: ChannelRevenue[];
    comparison: RevenueComparison;
}

export interface LTVDistribution {
    range: string;
    count: number;
}

export interface PurchaseFrequency {
    label: string;
    count: number;
}

export interface SessionDistribution {
    userId: string;
    sessionCount: number;
}

export interface UserSegmentData {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    avgLifetimeValue: number;
    ltvDistribution: LTVDistribution[];
    purchaseFrequency: PurchaseFrequency[];
    sessionDistribution: SessionDistribution[];
}

export interface RegionBreakdown {
    region: string;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface BrowserBreakdown {
    browser: string;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface GeographicData {
    regionBreakdown: RegionBreakdown[];
    browserBreakdown: BrowserBreakdown[];
}

export interface HourlyPattern {
    hour: number;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface DailyPattern {
    day: string;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface WeeklyPattern {
    week: string;
    sessions: number;
    conversions: number;
    rate: number;
}

export interface TimePatterns {
    hourlyPatterns: HourlyPattern[];
    dailyPatterns: DailyPattern[];
    weeklyPatterns: WeeklyPattern[];
}

export interface DashboardMeta {
    days: number;
    startDate: string;
    endDate: string;
}

export interface OverviewData {
    funnel: FunnelStage[];
    cart: CartBehaviorMetrics;
    conversion: ConversionData;
    revenue: RevenueData;
    users: UserSegmentData;
    geographic: GeographicData;
    timepatterns: TimePatterns;
    meta: DashboardMeta;
}
