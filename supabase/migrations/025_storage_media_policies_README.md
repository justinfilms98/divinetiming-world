# Storage bucket "media" – RLS policies

## Option 1: Run the SQL via Supabase CLI (recommended)

The policies are in **`026_storage_media_policies.sql`**. Apply it with:

```bash
supabase db push
```

(or `supabase migration up` if you use that workflow). Migrations run with owner privileges, so the policies on `storage.objects` will be created. The SQL Editor cannot do this (you get "must be owner of table objects").

## Option 2: Create policies in the Dashboard

The SQL Editor **cannot** create these (you get "must be owner of table objects"). Use either the CLI (Option 1) or the Dashboard:

**Storage → Buckets → select `media` → Policies → New policy** (×4)

### Copy-paste values (use template "For full customization")

| # | Policy name        | Allowed operation | Role           | USING expression      | WITH CHECK expression  |
|---|--------------------|-------------------|----------------|------------------------|------------------------|
| 1 | `media_public_read`  | SELECT            | `public`       | `bucket_id = 'media'`  | *(leave empty)*        |
| 2 | `media_auth_insert`  | INSERT            | `authenticated`| *(leave empty)*       | `bucket_id = 'media'`   |
| 3 | `media_auth_update`  | UPDATE            | `authenticated`| `bucket_id = 'media'`  | `bucket_id = 'media'`   |
| 4 | `media_auth_delete`  | DELETE            | `authenticated`| `bucket_id = 'media'`  | *(leave empty)*        |

For each policy: name = exact value in column 2; operation = column 3; target role = column 4; paste the USING and WITH CHECK expressions where the UI asks for them.

**Step-by-step (New policy in the Dashboard):**

1. **Read (public)**  
   - Policy name: `media_public_read`  
   - Allowed operation: **SELECT**  
   - Target roles: **public** (or leave default if it applies to all)  
   - USING expression: `bucket_id = 'media'`

2. **Insert (authenticated)**  
   - Policy name: `media_auth_insert`  
   - Allowed operation: **INSERT**  
   - Target roles: **authenticated**  
   - WITH CHECK expression: `bucket_id = 'media'`

3. **Update (authenticated)**  
   - Policy name: `media_auth_update`  
   - Allowed operation: **UPDATE**  
   - Target roles: **authenticated**  
   - USING: `bucket_id = 'media'`  
   - WITH CHECK: `bucket_id = 'media'`

4. **Delete (authenticated)**  
   - Policy name: `media_auth_delete`  
   - Allowed operation: **DELETE**  
   - Target roles: **authenticated**  
   - USING expression: `bucket_id = 'media'`

Your upload route uses the **service role** (`supabaseAdmin()`), so it bypasses RLS. These policies allow authenticated users (e.g. Admin UI with session) to manage objects in the `media` bucket if you ever use the client Supabase instance for storage.
