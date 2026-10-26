-- Rollback 055_storage_lockdown.sql
-- WARNING: restores the previous OPEN storage write policies.

DROP POLICY IF EXISTS "Admins insert objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins update objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete objects" ON storage.objects;

CREATE POLICY "Anon can update media" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'media');
CREATE POLICY "Anon can upload to media" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'media');
CREATE POLICY "Auth delete all buckets" ON storage.objects FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth update all buckets" ON storage.objects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth upload event-thumbnails" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-thumbnails');
CREATE POLICY "Auth upload gallery-covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery-covers');
CREATE POLICY "Auth upload hero-videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hero-videos');
CREATE POLICY "Auth upload music-covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'music-covers');
CREATE POLICY "Auth upload public-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-media');
CREATE POLICY "Auth users can delete from media bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');
CREATE POLICY "Auth users can update media bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media');
CREATE POLICY "media_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');
CREATE POLICY "media_insert_fixed" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "media_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');
CREATE POLICY "public_media_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'public-media');
CREATE POLICY "public_media_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-media');
CREATE POLICY "public_media_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'public-media') WITH CHECK (bucket_id = 'public-media');
