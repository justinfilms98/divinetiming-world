# Architecture Overview

## Tech Stack

- **Next.js 16** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Supabase** - Auth, Database, Storage
- **Stripe** - Payment processing

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── (routes)/          # Public routes
│   ├── admin/             # Admin panel routes
│   └── api/               # API routes
├── components/            # React components
│   ├── admin/             # Admin components
│   ├── home/              # Home page components
│   ├── layout/            # Layout components
│   └── shop/              # Shop components
├── lib/                   # Utility functions
│   └── supabase/          # Supabase clients
├── supabase/
│   └── migrations/        # Database migrations
└── public/               # Static assets
    └── brand/             # Brand assets
```

## Database Schema

All tables use UUID primary keys and include `created_at`/`updated_at` timestamps.

### Core Tables
- `site_settings` - Single row with all site configuration
- `admin_users` - Admin allowlist
- `presskit` - Single row with press kit content

### Content Tables
- `events` - Tour dates
- `videos` - YouTube videos
- `photo_albums` - Photo collections
- `photos` - Individual photos (linked to albums)

### E-commerce Tables
- `products` - Merch products
- `product_variants` - Product options (size, color, etc.)
- `product_images` - Product photos
- `orders` - Stripe orders
- `order_items` - Order line items

## Authentication Flow

1. User signs in via Supabase Auth
2. Middleware checks email against allowlist
3. If allowed, checks `admin_users` table
4. Grants access to `/admin` routes

## Stripe Checkout Flow

1. User selects product → `/api/checkout` creates Stripe session
2. User redirected to Stripe Checkout
3. After payment → Stripe webhook → `/api/webhooks/stripe`
4. Webhook creates order in database
5. Inventory decremented automatically

## Design Philosophy

- **Hero-first**: Fullscreen hero section on homepage
- **Minimal navigation**: Clean, simple menu structure
- **Subtle animations**: Framer Motion with restraint
- **Cosmic aesthetic**: Dark theme with orange accents
- **Mobile-first**: Responsive design throughout

## Key Features

- Admin can override hero with image/video
- Products support variants (size, color, etc.)
- Inventory tracking with automatic decrement
- Press kit with editable sections
- Photo albums with lightbox viewer
- YouTube video embeds
