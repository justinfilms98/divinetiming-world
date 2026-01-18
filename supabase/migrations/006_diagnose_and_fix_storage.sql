-- Diagnostic and Fix for Storage RLS Issues
-- This will drop only the policies we've created and recreate them with simpler names

-- Drop only the policies we've created (by name)
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from media" ON storage.objects;
DROP POLICY IF EXISTS "media_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "media_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "media_public_select" ON storage.objects;

-- Now create the most permissive policies possible for the media bucket
-- These allow ANY authenticated user to do ANYTHING with the media bucket

-- INSERT: Allow any authenticated user to upload
CREATE POLICY "media_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- UPDATE: Allow any authenticated user to update
CREATE POLICY "media_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- DELETE: Allow any authenticated user to delete
CREATE POLICY "media_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- SELECT: Allow public to read
CREATE POLICY "media_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Verify RLS is enabled on storage.objects (it should be by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
