-- ============================================================
-- Storage lockdown. Anon could upload/overwrite files in `media`,
-- and any signed-in user could update/delete objects in every
-- bucket. Writes are now admin-only (public.is_admin(), 054).
-- Signed upload URLs created by the service role are unaffected.
-- Public read policies are unchanged.
-- Rollback: 055_storage_lockdown.down.sql
-- ============================================================

DROP POLICY IF EXISTS "Anon can update media" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload to media" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete all buckets" ON storage.objects;
DROP POLICY IF EXISTS "Auth update all buckets" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload event-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload gallery-covers" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload hero-videos" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload music-covers" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload public-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete from media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update media bucket" ON storage.objects;
DROP POLICY IF EXISTS "media_delete" ON storage.objects;
DROP POLICY IF EXISTS "media_insert_fixed" ON storage.objects;
DROP POLICY IF EXISTS "media_update" ON storage.objects;
DROP POLICY IF EXISTS "public_media_delete" ON storage.objects;
DROP POLICY IF EXISTS "public_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_media_update" ON storage.objects;

CREATE POLICY "Admins insert objects" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update objects" ON storage.objects
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete objects" ON storage.objects
  FOR DELETE TO authenticated USING (public.is_admin());
