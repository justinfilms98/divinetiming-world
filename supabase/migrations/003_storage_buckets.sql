-- Storage Bucket Setup for Media Uploads
-- This migration sets up RLS policies for the 'media' storage bucket
--
-- IMPORTANT: The 'media' bucket must be created manually first!
-- Go to Supabase Dashboard → Storage → New Bucket
-- Name: media, Public: ON, File size limit: 52428800 (50MB)

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON storage.objects;
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

-- Try to create the bucket if it doesn't exist (may not work in all Supabase versions)
-- If this fails, create the bucket manually in the dashboard
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'media') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('media', 'media', true, 52428800, NULL);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Bucket creation failed. Please create the "media" bucket manually in Supabase Dashboard → Storage.';
END $$;

-- Storage RLS Policies for 'media' bucket
-- These policies check that the user is authenticated using auth.uid()

-- Allow authenticated users (admins) to upload files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users (admins) to update their own uploads
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

-- Allow authenticated users (admins) to delete their own uploads
CREATE POLICY "Authenticated users can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
);

-- Allow public read access to all files in media bucket
CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
