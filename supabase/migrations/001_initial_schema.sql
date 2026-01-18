-- DIVINE:TIMING Website - Complete Database Schema
-- Built from scratch, no dependencies on old code

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SITE SETTINGS
-- ============================================
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_name TEXT NOT NULL DEFAULT 'DIVINE:TIMING',
  member_1_name TEXT DEFAULT 'Liam Bongo',
  member_2_name TEXT DEFAULT 'Lex Laurence',
  hero_media_type TEXT CHECK (hero_media_type IN ('image', 'video', 'default')),
  hero_media_url TEXT,
  instagram_url TEXT DEFAULT 'https://www.instagram.com/divinetiming_ofc',
  youtube_url TEXT DEFAULT 'https://www.youtube.com/@divinetimingworld',
  spotify_url TEXT DEFAULT 'https://open.spotify.com/artist/3oXSupbNxaPpkEnMbuK8IS',
  apple_music_url TEXT DEFAULT 'https://music.apple.com/es/artist/divine-timing/1851580045',
  booking_phone TEXT DEFAULT '+33 635 640 200',
  booking_email TEXT DEFAULT 'info@divinetimingmusic.com',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (id) VALUES (uuid_generate_v4());

-- ============================================
-- ADMIN USERS (Allowlist)
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'owner_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin user
INSERT INTO admin_users (email, role) 
VALUES ('divinetiming.world@gmail.com', 'owner_admin');

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMPTZ NOT NULL,
  city TEXT NOT NULL,
  venue TEXT NOT NULL,
  ticket_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(date DESC);
CREATE INDEX idx_events_featured ON events(is_featured) WHERE is_featured = true;

-- ============================================
-- VIDEOS
-- ============================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  youtube_id TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_featured ON videos(is_featured) WHERE is_featured = true;
CREATE INDEX idx_videos_order ON videos(display_order);

-- ============================================
-- PHOTO ALBUMS
-- ============================================
CREATE TABLE photo_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_albums_order ON photo_albums(display_order);

-- ============================================
-- PHOTOS
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_album ON photos(album_id);
CREATE INDEX idx_photos_order ON photos(display_order);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stripe_product_id TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- ============================================
-- PRODUCT VARIANTS
-- ============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Small", "Red", "Small - Red"
  price_cents INTEGER, -- null means use product price
  inventory_count INTEGER DEFAULT 0,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ============================================
-- PRODUCT IMAGES
-- ============================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_order ON product_images(display_order);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_session ON orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- PRESS KIT
-- ============================================
CREATE TABLE presskit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'DIVINE:TIMING',
  bio_text TEXT NOT NULL,
  experience_text TEXT NOT NULL,
  audience_text TEXT,
  links_text TEXT,
  tech_rider_text TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed presskit content
INSERT INTO presskit (bio_text, experience_text) VALUES (
  'DIVINE:TIMING are a unique duo who integrate live percussion and vocals into their performances, crafting powerful Afro and organic house music inspired by tribes, religions and cultures from around the world. Their mission is to reconnect people with their roots and to remind us that beyond nationalities, languages and backgrounds, we are all one. The spiral they wear has become the emblem of this message of unity and of a timeless connection to the source of all things.

More than a conventional performance act, DIVINE:TIMING see their union as a calling; two artists brought together by the universe to help heal the world through music.

Born in the UK and raised in the Canary Islands, the duo have spent the past two years building strong momentum: hosting their own events, nurturing a devoted community they call their tribe, and producing original music that is now receiving official releases. Their debut single "HANUMANTUM" is out now and has charted in Beatport''s Top 100 Hype Afro House, alongside SAFAR''s remix, which has entered the Top 100 Hype Organic House.',
  
  'When a venue can host the full DIVINE:TIMING experience, the duo performs at its highest level: Lex sings and chants mantras while DJ''ing, and Liam deploys a full live drum setup, pushing each track to its maximum impact on the dance floor. They are natural performers who feel at home in the spotlight and treat every appearance as a focused, intentional act, projecting an energy that leaves audiences completely immersed into the moment being created.

Over the past two years they have successfully hosted more than 40 of their own events, travelled repeatedly to Montenegro, and appeared in cities such as Marbella, Barcelona and Gran Canaria. Back home in Tenerife, they have brought their sound to Papagayo, the island''s biggest nightclub, as well as major stages including Afrotronic Festival and SAOKO Fest, cementing their presence within the island''s emerging electronic and Afro house scene, and are now ready to extend their horizons once again and go where the universe calls them next.'
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE presskit ENABLE ROW LEVEL SECURITY;

-- Public read access for public tables
CREATE POLICY "Public read access" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON videos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON photo_albums FOR SELECT USING (true);
CREATE POLICY "Public read access" ON photos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public read access" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read access" ON presskit FOR SELECT USING (true);

-- Admin full access (will be enforced via middleware + allowlist check)
CREATE POLICY "Admin full access" ON site_settings FOR ALL USING (true);
CREATE POLICY "Admin full access" ON events FOR ALL USING (true);
CREATE POLICY "Admin full access" ON videos FOR ALL USING (true);
CREATE POLICY "Admin full access" ON photo_albums FOR ALL USING (true);
CREATE POLICY "Admin full access" ON photos FOR ALL USING (true);
CREATE POLICY "Admin full access" ON products FOR ALL USING (true);
CREATE POLICY "Admin full access" ON product_variants FOR ALL USING (true);
CREATE POLICY "Admin full access" ON product_images FOR ALL USING (true);
CREATE POLICY "Admin full access" ON orders FOR ALL USING (true);
CREATE POLICY "Admin full access" ON order_items FOR ALL USING (true);
CREATE POLICY "Admin full access" ON presskit FOR ALL USING (true);
CREATE POLICY "Admin full access" ON admin_users FOR ALL USING (true);
