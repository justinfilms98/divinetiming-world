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
   - **First:** Run `supabase/migrations/000_cleanup_old_schema.sql` (removes old tables/policies)
   - **Then:** Run `supabase/migrations/001_initial_schema.sql` (creates new schema)
   - **Finally:** Run `supabase/migrations/002_inventory_function.sql` (creates inventory function)

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
