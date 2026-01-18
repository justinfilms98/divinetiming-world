# Storage Bucket Setup Instructions

If you're getting RLS (Row Level Security) errors when uploading files, follow these steps:

## Option 1: Manual Bucket Creation (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set the bucket name to: `media`
5. Make it **Public** (toggle ON)
6. Set file size limit to: `52428800` (50MB) or leave default
7. Click **"Create bucket"**

## Option 2: Run SQL Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the migration: `supabase/migrations/003_storage_buckets.sql`
3. This will create the bucket and set up RLS policies

## Verify Setup

After creating the bucket, verify the RLS policies are set:

1. Go to **Storage** → **Policies** tab
2. You should see policies for the `media` bucket:
   - "Authenticated users can upload media" (INSERT)
   - "Authenticated users can update media" (UPDATE)
   - "Authenticated users can delete media" (DELETE)
   - "Public can read media" (SELECT)

## Troubleshooting

If uploads still fail:

1. **Check authentication**: Make sure you're logged in as the admin user
2. **Check bucket exists**: Go to Storage → Buckets and verify `media` bucket exists
3. **Check policies**: Go to Storage → Policies and verify policies are active
4. **Check browser console**: Look for detailed error messages

## Manual Policy Creation (if SQL doesn't work)

If the SQL migration doesn't create policies, create them manually:

1. Go to **Storage** → **Policies** tab
2. Click **"New Policy"** for the `media` bucket
3. Create these policies:

**Policy 1: Authenticated Upload**
- Policy name: "Authenticated users can upload media"
- Allowed operation: INSERT
- Target roles: authenticated
- USING expression: `bucket_id = 'media'`
- WITH CHECK expression: `bucket_id = 'media'`

**Policy 2: Authenticated Update**
- Policy name: "Authenticated users can update media"
- Allowed operation: UPDATE
- Target roles: authenticated
- USING expression: `bucket_id = 'media'`
- WITH CHECK expression: `bucket_id = 'media'`

**Policy 3: Authenticated Delete**
- Policy name: "Authenticated users can delete media"
- Allowed operation: DELETE
- Target roles: authenticated
- USING expression: `bucket_id = 'media'`

**Policy 4: Public Read**
- Policy name: "Public can read media"
- Allowed operation: SELECT
- Target roles: public
- USING expression: `bucket_id = 'media'`
