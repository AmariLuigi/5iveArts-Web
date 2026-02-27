-- ============================================================
-- 5iveArts — Supabase Database Update
-- Migration: 002_update_schema.sql
-- ============================================================

-- 1. Add missing status and videos columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- 2. Update the category constraint to match the expanded application types
-- First, remove the old constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- Add the new constraint with expanded values
ALTER TABLE public.products 
ADD CONSTRAINT products_category_check 
CHECK (category IN ('figures', 'busts', 'dioramas', 'hand-painted', 'home-printed'));

-- 3. (Optional) Migrate existing data from old categories to 'figures'
UPDATE public.products SET category = 'figures' WHERE category = 'hand-painted';
UPDATE public.products SET category = 'figures' WHERE category = 'home-printed';
