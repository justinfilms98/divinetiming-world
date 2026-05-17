-- Create Storage RLS Policies for 'media' bucket
-- IMPORTANT: Before running this, manually delete all existing policies for the 'media' bucket
-- in Supabase Dashboard → Storage → Policies tab
-- Then run this migration to create fresh, simple policies

-- Create policies with simple, clear names
-- These are the most permissive policies that should work

-- INSERT: Allow any authenticated user to upload
CREATE POLICY "media_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- UPDATE: Allow any authenticated user to update
CREATE POLICY "media_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- DELETE: Allow any authenticated user to delete
CREATE POLICY "media_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- SELECT: Allow public to read
CREATE POLICY "media_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
