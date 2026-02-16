-- Phase 30I: Deep Cleanup Audit (READ-ONLY + CANDIDATES + COMMENTED CLEANUP)
-- Run Section 1 and 2 first. Review output before uncommenting any Section 3.

-- =============================================================================
-- SECTION 1: READ-ONLY INVENTORY (safe to run)
-- =============================================================================

-- 1.1 All public tables with row counts
SELECT
  schemaname,
  tablename,
  (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', schemaname, tablename), false, true, '')))[1]::text::int AS row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 1.2 All RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 1.3 All functions in public schema
SELECT n.nspname AS schema, p.proname AS name, pg_get_function_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 1.4 All triggers
SELECT tgname AS trigger_name, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgrelid::regclass::text, tgname;

-- 1.5 Storage buckets (Supabase: storage.buckets)
SELECT id, name, public FROM storage.buckets ORDER BY name;

-- 1.6 Table dependencies (foreign keys)
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- SECTION 2: CANDIDATES FOR REMOVAL (SELECT-only report)
-- =============================================================================

-- 2.1 Tables with row counts — candidates for removal = 0 rows AND not in code-referenced list
-- Code-referenced tables (Phase 30 audit): admin_users, analytics_events, about_content, about_photos,
-- about_timeline, booking_content, booking_inquiries, events, external_media_assets, gallery_media,
-- galleries, hero_sections, media_carousel_slides, order_items, orders, page_settings, presskit,
-- product_images, products, product_variants, site_settings, videos
SELECT
  relname AS table_name,
  n_live_tup AS row_estimate
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
-- If row_estimate = 0 and table_name is NOT in the code-referenced list above, it may be a removal candidate.

-- 2.2 Policies on tables (for manual review: policies on dropped tables should be dropped first)
-- No automatic "unused" policy report; use Section 1.2 output.

-- 2.3 Functions not referenced by code (best-effort by naming)
-- Application uses: no custom RPC names found in codebase grep; report only.

-- =============================================================================
-- SECTION 3: EXECUTION CLEANUP (COMMENTED OUT — uncomment only after review)
-- =============================================================================

-- Only uncomment after:
-- 1. Running Section 1 and 2 and saving results.
-- 2. Confirming with codebase search that a table/function/policy is unused.
-- 3. Ensuring drop order: policies -> triggers -> functions -> tables.

-- Example (DO NOT run unless you confirmed the object is unused):
-- DROP POLICY IF EXISTS "some_policy_name" ON public.some_table;
-- DROP TRIGGER IF EXISTS some_trigger ON public.some_table;
-- DROP FUNCTION IF EXISTS public.some_function(args);
-- DROP TABLE IF EXISTS public.unused_table;

-- Safe-to-uncomment list: run scripts/supabase-inventory.mjs after saving
-- Section 1+2 output to supabase/inventory_output.txt. The script prints
-- 0-row tables not in the code-referenced list; add only those you confirm
-- as unused, e.g.:
--   -- DROP TABLE IF EXISTS public.confirmed_unused_table;
-- then uncomment that single line after review.
