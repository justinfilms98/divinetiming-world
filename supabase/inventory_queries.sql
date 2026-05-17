-- Run this in Supabase SQL Editor (Dashboard > SQL Editor).
-- Copy full output and save to supabase/inventory_output.txt (or run: node scripts/supabase-inventory.mjs --instructions)

-- ========== SECTION 1 ==========
SELECT 'SECTION 1.1 - Tables with row counts' AS report;
SELECT schemaname, tablename,
  (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I.%I', schemaname, tablename), false, true, '')))[1]::text::int AS row_count
FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT 'SECTION 1.2 - RLS policies' AS report;
SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

SELECT 'SECTION 1.3 - Functions' AS report;
SELECT n.nspname AS schema, p.proname AS name, pg_get_function_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' ORDER BY p.proname;

SELECT 'SECTION 1.4 - Triggers' AS report;
SELECT tgname AS trigger_name, tgrelid::regclass AS table_name FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgrelid::regclass::text;

SELECT 'SECTION 1.5 - Storage buckets' AS report;
SELECT id, name, public FROM storage.buckets ORDER BY name;

SELECT 'SECTION 1.6 - Foreign keys' AS report;
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' ORDER BY tc.table_name;

-- ========== SECTION 2 ==========
SELECT 'SECTION 2.1 - Table row estimates (0 = candidate if not in code list)' AS report;
SELECT relname AS table_name, n_live_tup AS row_estimate
FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY relname;
