# DIVINE:TIMING Website

A modern artist website template built with Next.js, Tailwind CSS, Framer Motion, Supabase, and Stripe.

## Features

- **Hero-first design** inspired by louisthechild.com
- **Full admin panel** for managing content
- **Stripe Checkout** integration for merch sales
- **Supabase** for auth, database, and storage
- **Responsive design** with mobile hamburger menu
- **Cosmic eclipse aesthetic** with DIVINE:TIMING branding

## Setup

### 1. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY=your_uploadcare_public_key
# Optional: comma-separated admin emails (or use admin_users table)
# ADMIN_EMAILS=admin@example.com,other@example.com
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**Required for admin media uploads (Uploadcare):**
- `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` – client-side; used by UniversalUploader (device, camera, URL, Google Drive, OneDrive, Dropbox)
- `SUPABASE_SERVICE_ROLE_KEY` – server-side; used by `/api/assets/external` and `/api/admin/events` (bypasses RLS)

**Optional:** `ADMIN_EMAILS` – comma-separated list of emails that can access admin and save assets/events (alternative to `admin_users` table)

### 2. Supabase Setup

1. Create a new Supabase project (or use existing)
2. **If you have old tables**, run the cleanup first:
   - `000_cleanup_old_schema.sql` - Removes old tables, policies, and functions
3. Run the migrations in `supabase/migrations/` (in order):
   - `001_initial_schema.sql` - Creates all tables
   - `002_inventory_function.sql` - Creates inventory decrement function

4. Set up Supabase Storage buckets if you plan to upload media files

### 3. Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up a webhook endpoint pointing to `/api/webhooks/stripe`
4. Add the webhook secret to your environment variables

### 4. Brand Assets

Place your brand assets in `public/brand/`:
- `logo.svg` - Main logo
- `hero-eclipse.jpg` - Default hero background image

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

## Admin Access

- **Email**: divinetiming.world@gmail.com
- **Route**: `/admin`
- **Login**: `/login`

The admin email is hardcoded in the allowlist. Only this email can access the admin panel.

## Database Schema

- `site_settings` - Brand settings, hero media, social links
- `admin_users` - Admin allowlist
- `events` - Tour dates
- `videos` - YouTube videos
- `photo_albums` - Photo album collections
- `photos` - Individual photos
- `products` - Merch products
- `product_variants` - Product variants (size, color, etc.)
- `product_images` - Product images
- `orders` - Stripe orders
- `order_items` - Order line items
- `presskit` - Press kit content

## Routes

### Public Routes
- `/` - Home page
- `/events` - Events (redirects from legacy `/tour`)
- `/shop` - Product listing
- `/shop/[slug]` - Product detail
- `/media` - Photos and videos
- `/about` - About page
- `/booking` - Booking information
- `/presskit` - Press kit

### Admin Routes
- `/admin` - Dashboard
- `/admin/settings` - Site settings
- `/admin/events` - Manage events
- `/admin/media` - Manage videos and photo albums
- `/admin/shop` - Manage products
- `/admin/orders` - View orders
- `/admin/presskit` - Edit press kit

## Stripe Checkout Flow

1. User selects product and variant
2. Clicks "Buy Now"
3. Redirected to Stripe Checkout
4. After payment, webhook creates order in database
5. Inventory is decremented automatically

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Framer Motion**
- **Supabase** (Auth, Database, Storage)
- **Stripe** (Checkout)

## License

Private - DIVINE:TIMING
