-- ============================================================
-- 5iveArts — Supabase Database Schema
-- Migration: 001_schema.sql
--
-- Run via: Supabase Dashboard → SQL Editor → paste & run
-- Or: supabase db push  (if using the Supabase CLI)
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
-- gen_random_uuid() is built-in from Postgres 13+ (enabled by default in Supabase)

-- ── Updated-at trigger helper ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: products
-- Mirrors the static product catalogue in src/lib/products.ts.
-- Seed this table with supabase/seed.sql.
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id           TEXT        PRIMARY KEY,          -- e.g. "hp-spider-man-001"
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  price        INTEGER     NOT NULL CHECK (price > 0),  -- pence/cents
  images       TEXT[]      NOT NULL DEFAULT '{}',
  category     TEXT        NOT NULL CHECK (category IN ('hand-painted', 'home-printed')),
  stock        INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  details      TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: orders
-- Created when Stripe fires checkout.session.completed.
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id       TEXT        UNIQUE NOT NULL,
  stripe_payment_intent   TEXT,                          -- filled once available
  customer_email          TEXT        NOT NULL,
  customer_name           TEXT        NOT NULL,
  status                  TEXT        NOT NULL DEFAULT 'paid'
                            CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),

  -- Monetary amounts (all in pence/cents)
  subtotal_pence          INTEGER     NOT NULL CHECK (subtotal_pence >= 0),
  shipping_pence          INTEGER     NOT NULL CHECK (shipping_pence >= 0),
  total_pence             INTEGER     NOT NULL CHECK (total_pence >= 0),

  -- Packlink fulfilment (populated after label is created)
  packlink_service_id     TEXT,
  packlink_shipment_id    TEXT,
  tracking_number         TEXT,
  label_url               TEXT,

  -- Denormalised shipping address (Stripe-supplied, stored as JSONB for flexibility)
  shipping_address        JSONB       NOT NULL DEFAULT '{}',

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session   ON orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email   ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at       ON orders (created_at DESC);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: order_items
-- One row per product line in an order.
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id            TEXT        NOT NULL REFERENCES products(id),
  product_name          TEXT        NOT NULL,   -- snapshot of name at time of purchase
  product_price_pence   INTEGER     NOT NULL CHECK (product_price_pence > 0),
  quantity              INTEGER     NOT NULL CHECK (quantity > 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- ============================================================
-- ROW-LEVEL SECURITY
-- Public (anon) users can only read products.
-- All write operations go through the service-role key (server-side only).
-- ============================================================
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read
CREATE POLICY "products_read_public"
  ON products FOR SELECT
  USING (true);

-- Products: only service role can write (INSERT/UPDATE/DELETE come through API routes)
CREATE POLICY "products_write_service_role"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Orders: no public read — only the service role (used by webhook and admin)
CREATE POLICY "orders_service_role"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Order items: same — service role only
CREATE POLICY "order_items_service_role"
  ON order_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FUNCTION: decrement_stock(product_id, qty)
-- Called inside the webhook transaction to atomically reduce stock.
-- Returns the new stock value.
-- ============================================================
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id TEXT, p_qty INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as the function owner (postgres / service role)
AS $$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE products
  SET    stock = GREATEST(0, stock - p_qty)
  WHERE  id = p_product_id
  RETURNING stock INTO new_stock;

  RETURN new_stock;
END;
$$;
