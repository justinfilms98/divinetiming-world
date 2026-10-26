-- ============================================================
-- Drop legacy storage policies that hard-code admin emails and
-- sub-select auth.users. Non-service roles cannot read auth.users,
-- so these raise "permission denied for table users" and block
-- admin browser uploads. 055 "Admins * objects" policies replace them.
-- Rollback: 056_storage_drop_email_policies.down.sql
-- ============================================================

DROP POLICY IF EXISTS "Admins can delete event thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gallery covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete hero videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete music covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload event thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gallery covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload hero videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload music covers" ON storage.objects;
