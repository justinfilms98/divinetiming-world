-- CLEANUP OLD SCHEMA
-- Run this FIRST to remove all old tables, policies, and functions
-- This ensures a clean slate before running the new migrations
--
-- Note: Dropping tables with CASCADE automatically removes all policies,
-- so we don't need to drop policies separately.

-- ============================================
-- DROP OLD TABLES (CASCADE automatically removes policies and dependencies)
-- ============================================

-- Drop tables that might have foreign keys first
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.photo_albums CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.presskit CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Old tables from previous schema
DROP TABLE IF EXISTS public.media_items CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.music_releases CASCADE;
DROP TABLE IF EXISTS public.hero_content CASCADE;
DROP TABLE IF EXISTS public.hero_videos CASCADE;
DROP TABLE IF EXISTS public.event_galleries CASCADE;
DROP TABLE IF EXISTS public.events_prisma CASCADE;
DROP TABLE IF EXISTS public.media_items_prisma CASCADE;
DROP TABLE IF EXISTS public.site_content CASCADE;

-- ============================================
-- DROP OLD FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS decrement_inventory(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.decrement_inventory(UUID, INTEGER);

-- ============================================
-- DROP OLD EXTENSIONS (if not needed)
-- ============================================

-- Note: We keep uuid-ossp as the new schema uses it
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================
-- CLEANUP COMPLETE
-- ============================================

-- Now you can safely run:
-- 001_initial_schema.sql
-- 002_inventory_function.sql
