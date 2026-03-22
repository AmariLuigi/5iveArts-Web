-- ═══════════════════════════════════════════════════════════════════════════
-- analytics_events — Delta Migration (run this if table already exists)
-- Applies: CHECK constraint, composite indexes, user partial index
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Drop old unconstrained event_type column and re-add with CHECK
--    (Only needed once; safe to run multiple times via IF NOT EXISTS / DO blocks)

DO $$ BEGIN
  -- Add CHECK constraint only if it doesn't exist yet
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'analytics_events_event_type_check'
      AND conrelid = 'public.analytics_events'::regclass
  ) THEN
    ALTER TABLE public.analytics_events
    ADD CONSTRAINT analytics_events_event_type_check
    CHECK (event_type IN (
      'product_viewed',
      'variant_selected',
      'add_to_cart',
      'remove_from_cart',
      'cart_viewed',
      'checkout_step_1',
      'checkout_step_2',
      'checkout_step_3',
      'checkout_complete',
      'checkout_abandoned',
      'checkout_address_error',
      'courier_selected',
      'payment_failed',
      'payment_success',
      'payment_gateway_error'
    ));
    RAISE NOTICE 'CHECK constraint added.';
  ELSE
    RAISE NOTICE 'CHECK constraint already exists, skipping.';
  END IF;
END $$;

-- 2. Composite index: session funnel queries
CREATE INDEX IF NOT EXISTS idx_analytics_session_time
    ON public.analytics_events(session_id, created_at ASC);

-- 3. Composite index: dashboard type + date range queries
CREATE INDEX IF NOT EXISTS idx_analytics_type_time
    ON public.analytics_events(event_type, created_at DESC);

-- 4. Partial index: authenticated user CLV / repeat-customer queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_time
    ON public.analytics_events(user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

-- 5. Keep single-column indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);

SELECT 'Delta migration complete ✓' AS status;
