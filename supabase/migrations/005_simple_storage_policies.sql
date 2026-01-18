-- Simple Storage RLS Policies for 'media' bucket
-- These are the simplest possible policies that should work
-- Run this to replace all existing policies with simpler versions

-- Drop ALL existing policies for storage.objects
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

-- Create the simplest possible policies
-- INSERT: Any authenticated user can upload to media bucket
CREATE POLICY "Allow authenticated uploads to media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- UPDATE: Any authenticated user can update files in media bucket
CREATE POLICY "Allow authenticated updates to media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- DELETE: Any authenticated user can delete files in media bucket
CREATE POLICY "Allow authenticated deletes from media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- SELECT: Public can read from media bucket
CREATE POLICY "Allow public reads from media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
