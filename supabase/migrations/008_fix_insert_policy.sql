-- Fix the INSERT policy for media bucket
-- The issue is that the INSERT policy needs to explicitly check auth.uid()
-- Drop and recreate the INSERT policy with explicit auth check

DROP POLICY IF EXISTS "media_insert" ON storage.objects;

-- Create INSERT policy with explicit auth.uid() check
CREATE POLICY "media_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
);
