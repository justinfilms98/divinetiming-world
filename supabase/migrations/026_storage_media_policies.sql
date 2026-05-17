-- RLS policies for bucket "media". Run via Supabase CLI (supabase db push), not SQL Editor.
-- SQL Editor gives "must be owner of table objects"; migrations run with owner privileges.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "media_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;

CREATE POLICY "media_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "media_auth_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

CREATE POLICY "media_auth_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

CREATE POLICY "media_auth_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media');
