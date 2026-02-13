# Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Run Supabase migrations** (in order!)
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run migrations in order: `000` → `001` → `002` → ... → `009` → `010` → `011` → `012`
   - **Phase 1:** `009_phase1_content_architecture.sql` adds page_settings, hero_sections, galleries, gallery_media, booking_content, about_content
   - **Phase 1:** `010_migrate_photo_albums_to_galleries.sql` migrates existing photo albums to galleries
   - **Phase 3/4:** `011_phase3_phase4_schema.sql` adds media_carousel_slides for media page hero
   - **Phase 6:** `012_phase6_booking_inquiries.sql` adds booking_inquiries for form submissions
   - **Phase 11:** `013_phase11_external_media.sql` adds external_media_assets for Google Drive picker
   - **Phase 3:** Admin media panel uses galleries (replaces photo_albums) with full gallery media management

4. **Set up Stripe webhook**
   - In Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`
   - Copy the webhook secret to `.env.local`

5. **Add brand assets** (optional)
   - Place `logo.svg` in `public/brand/`
   - Place `hero-eclipse.jpg` in `public/brand/`

6. **Start development server**
   ```bash
   npm run dev
   ```

## Admin Access

- Email: `divinetiming.world@gmail.com`
- First, sign up this email in Supabase Auth
- Then you can log in at `/login`

The admin user is automatically seeded in the database migration.

## Default Content

The database is seeded with:
- Default site settings
- Admin user (divinetiming.world@gmail.com)
- Press kit content (BIO and EXPERIENCE sections)

You can edit all content through the admin panel at `/admin`.

## Google Drive Media Picker (Phase 11, Optional)

To use "Select from Google Drive" in the admin panel:

1. **Create a Google Cloud project** and enable the Drive API
2. **Create a service account** (IAM → Service Accounts → Create)
3. **Download the JSON key** for the service account
4. **Share your Drive folder** with the service account email (e.g. `xxx@project.iam.gserviceaccount.com`) — give it "Viewer" access
5. **Add to `.env.local`**:
   ```env
   GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
   Paste the entire JSON as a single line (or use a file path with `GOOGLE_APPLICATION_CREDENTIALS`)

Without this, the Drive picker will show a setup step; the folder validation will fail until configured.
