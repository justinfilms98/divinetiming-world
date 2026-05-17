-- Bucket for hero media (and other public assets). Public read; authenticated upload.
-- If the INSERT fails (e.g. bucket must be created in Dashboard), create bucket "public-media"
-- manually: Storage → New bucket → Name: public-media, Public: ON, File size limit: 10MB.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-media',
  'public-media',
  true,
  10485760,
  ARRAY['image/png','image/jpeg','image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = COALESCE(EXCLUDED.allowed_mime_types, storage.buckets.allowed_mime_types);

-- Policies: authenticated can upload/update/delete; public can read
DROP POLICY IF EXISTS "public_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_media_update" ON storage.objects;
DROP POLICY IF EXISTS "public_media_delete" ON storage.objects;
DROP POLICY IF EXISTS "public_media_select" ON storage.objects;

CREATE POLICY "public_media_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public-media');

CREATE POLICY "public_media_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'public-media')
WITH CHECK (bucket_id = 'public-media');

CREATE POLICY "public_media_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'public-media');

CREATE POLICY "public_media_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'public-media');
