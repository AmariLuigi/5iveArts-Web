-- ═══════════════════════════════════════════════════════════════════════════
-- analytics_events — Telemetry table for the 5ive Arts store
-- Run this script ONCE in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Valid event types (enforced by CHECK constraint to prevent typo pollution)
-- Extend this list when adding new event types to the tracking pipeline.
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type text NOT NULL CHECK (event_type IN (
        -- Product discovery
        'product_viewed',
        'variant_selected',
        'filter_applied',
        'category_clicked',
        'search_performed',
        -- Cart interactions
        'add_to_cart',
        'remove_from_cart',
        'cart_viewed',
        -- Checkout funnel
        'checkout_step_1',
        'checkout_step_2',
        'checkout_step_3',
        'checkout_complete',
        'checkout_abandoned',
        'checkout_address_error',
        -- Shipping & logistics
        'courier_selected',
        -- Payment
        'payment_failed',
        'payment_success',
        'payment_gateway_error'
    )),
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop before re-creating so this script is safe to re-run
DROP POLICY IF EXISTS "Allow public inserts" ON public.analytics_events;
DROP POLICY IF EXISTS "Deny public reads" ON public.analytics_events;

-- Allow anyone (anonymous or authenticated) to INSERT events via the API route
CREATE POLICY "Allow public inserts" 
    ON public.analytics_events 
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Block direct SELECT from browser clients
CREATE POLICY "Deny public reads" 
    ON public.analytics_events 
    FOR SELECT 
    TO public
    USING (false);

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Single-column indexes for individual filter clauses
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);

-- Composite index: groups all events for a session in time order
-- Powers: funnel queries, abandonment detection, session replay
CREATE INDEX IF NOT EXISTS idx_analytics_session_time 
    ON public.analytics_events(session_id, created_at ASC);

-- Composite index: event type over time — most dashboard charts filter by type + date range
CREATE INDEX IF NOT EXISTS idx_analytics_type_time 
    ON public.analytics_events(event_type, created_at DESC);

-- Composite index: user-level analytics for CLV and repeat-customer queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_time 
    ON public.analytics_events(user_id, created_at DESC) 
    WHERE user_id IS NOT NULL;


-- ── Abandonment Detection Query (reference) ──────────────────────────────────
-- Identifies sessions that started checkout but never completed it.
-- Run this as a scheduled function or cron to generate checkout_abandoned records.
--
-- INSERT INTO analytics_events (event_type, session_id, event_data)
-- SELECT 
--     'checkout_abandoned',
--     session_id,
--     jsonb_build_object(
--         'last_step', MAX(event_type),
--         'last_seen_at', MAX(created_at),
--         'cart_total', MAX((event_data->>'cart_total')::numeric)
--     )
-- FROM analytics_events
-- WHERE event_type LIKE 'checkout_step_%'
--   AND session_id NOT IN (
--       SELECT DISTINCT session_id FROM analytics_events WHERE event_type = 'checkout_complete'
--   )
--   AND created_at < now() - interval '30 minutes'
--   AND created_at > now() - interval '24 hours'
-- GROUP BY session_id
-- ON CONFLICT DO NOTHING;
