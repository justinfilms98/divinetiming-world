-- Fix Storage RLS Policies for 'media' bucket
-- This migration updates the policies to explicitly check auth.uid()
-- Run this if uploads are still being blocked by RLS

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

-- Recreate policies with explicit auth.uid() checks
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
