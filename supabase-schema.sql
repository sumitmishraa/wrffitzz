-- ============================================
-- wrfitzz E-Commerce Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  rating NUMERIC(2,1) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  material TEXT,
  care_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS TABLE (Email / Google Auth & Admin Privileges)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing users table:
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'COD',
  payment_status TEXT DEFAULT 'PENDING',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing orders table:
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories and products
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);

-- Users policies
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

-- Allow public insert and read for orders
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Allow public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read order_items" ON order_items FOR SELECT USING (true);

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Shirts', 'shirts', 'Premium crafted shirts for every occasion', '/images/products/geometric-shirt-front.jpg'),
  ('Trousers', 'trousers', 'Tailored trousers with impeccable fit', '/images/products/gray-trousers.jpg'),
  ('Dresses', 'dresses', 'Elegant dresses for the modern woman', '/images/products/pink-floral-dress.jpg'),
  ('Accessories', 'accessories', 'Curated accessories to complete your look', '/images/products/paisley-squares.jpg'),
  ('Denims', 'denims', 'Premium denim crafted for comfort and style', '/images/products/check-shirt-front.jpg'),
  ('Hoodies', 'hoodies', 'Luxurious hoodies for elevated casual wear', '/images/products/geometric-shirt-front.jpg'),
  ('Jackets', 'jackets', 'Statement jackets that define your silhouette', '/images/products/check-shirt-back.jpg');

-- ============================================
-- SEED DATA: Products
-- ============================================
INSERT INTO products (name, slug, description, price, compare_price, category_id, images, sizes, colors, in_stock, is_featured, is_new, rating, review_count, material, care_instructions) VALUES

-- Geometric Print Shirt
(
  'Artisan Geometric Print Shirt',
  'artisan-geometric-print-shirt',
  'A masterfully crafted shirt featuring hand-embroidered geometric motifs in black and tan on premium white cotton. The intricate pixel-art inspired patterns create a contemporary yet timeless aesthetic. Perfect for smart-casual occasions.',
  2999.00,
  4499.00,
  (SELECT id FROM categories WHERE slug = 'shirts'),
  ARRAY['/images/products/geometric-shirt-combo.jpg', '/images/products/geometric-shirt-back.jpg', '/images/products/geometric-shirt-front.jpg'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['White'],
  TRUE, TRUE, TRUE, 4.8, 124,
  '100% Premium Cotton with embroidered detailing',
  'Machine wash cold. Do not bleach. Iron on low heat.'
),

-- Premium Gray Trousers
(
  'Premium Tailored Gray Trousers',
  'premium-tailored-gray-trousers',
  'Impeccably tailored trousers in sophisticated gray. Crafted from breathable, lightweight fabric with a durable quality finish. Features a classic straight-leg silhouette with pressed creases for a polished look.',
  1999.00,
  2999.00,
  (SELECT id FROM categories WHERE slug = 'trousers'),
  ARRAY['/images/products/gray-trousers.jpg', '/images/products/dual-trousers.jpg'],
  ARRAY['28', '30', '32', '34', '36', '38'],
  ARRAY['Gray', 'Black'],
  TRUE, TRUE, FALSE, 4.7, 89,
  'Premium blended fabric - Breathable and lightweight',
  'Machine wash cold. Tumble dry low. Iron as needed.'
),

-- Check Flannel Shirt
(
  'Heritage Check Flannel Shirt',
  'heritage-check-flannel-shirt',
  'A bold navy and white check pattern shirt crafted from soft, brushed flannel. The timeless plaid design pairs effortlessly with denim or chinos. Features a button-down collar and relaxed fit for everyday comfort.',
  2499.00,
  3499.00,
  (SELECT id FROM categories WHERE slug = 'shirts'),
  ARRAY['/images/products/check-shirt-front.jpg', '/images/products/check-shirt-back.jpg'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Navy Check'],
  TRUE, TRUE, TRUE, 4.6, 67,
  '100% Brushed Cotton Flannel',
  'Machine wash cold. Do not bleach. Hang dry recommended.'
),

-- Paisley Pocket Squares
(
  'Artisan Paisley Pocket Square Set',
  'artisan-paisley-pocket-square-set',
  'A curated collection of three handcrafted paisley pocket squares in jewel tones - emerald green, teal blue, and navy. Each piece features intricate traditional paisley patterns printed on premium cotton.',
  1299.00,
  1899.00,
  (SELECT id FROM categories WHERE slug = 'accessories'),
  ARRAY['/images/products/paisley-squares.jpg'],
  ARRAY['One Size'],
  ARRAY['Green', 'Teal', 'Navy'],
  TRUE, FALSE, TRUE, 4.9, 43,
  '100% Premium Printed Cotton',
  'Hand wash cold. Iron on medium heat. Do not tumble dry.'
),

-- Classic Dual Trousers
(
  'Essential Duo Trouser Set',
  'essential-duo-trouser-set',
  'Two pairs of impeccably tailored trousers in classic black and sophisticated gray. Crafted from breathable, durable fabric with a perfect fit. Features elegant detailing and a versatile straight-leg cut.',
  3499.00,
  4999.00,
  (SELECT id FROM categories WHERE slug = 'trousers'),
  ARRAY['/images/products/dual-trousers.jpg'],
  ARRAY['28', '30', '32', '34', '36', '38'],
  ARRAY['Black + Gray'],
  TRUE, TRUE, FALSE, 4.8, 156,
  'Premium blended fabric - Breathable and durable',
  'Machine wash cold. Iron on medium heat.'
),

-- Red Graphic Brave Shirt
(
  'Bold "Brave" Graphic Shirt',
  'bold-brave-graphic-shirt',
  'Make a statement with this vibrant red shirt featuring an exclusive hand-painted "BRAVE" graphic on the back. The artistic illustration adds a streetwear edge to a classic button-down silhouette.',
  2799.00,
  3999.00,
  (SELECT id FROM categories WHERE slug = 'shirts'),
  ARRAY['/images/products/red-brave-shirt.jpg'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Red'],
  TRUE, FALSE, TRUE, 4.5, 38,
  '100% Cotton Twill with printed graphic',
  'Turn inside out before washing. Machine wash cold.'
),

-- Premium Black Trousers
(
  'Noir Classic Trousers',
  'noir-classic-trousers',
  'The definitive black trouser. Cut from premium fabric with breathable construction and a perfect drape. Features a tailored fit with classic styling details. The essential foundation of any refined wardrobe.',
  2299.00,
  3299.00,
  (SELECT id FROM categories WHERE slug = 'trousers'),
  ARRAY['/images/products/black-trousers.jpg'],
  ARRAY['28', '30', '32', '34', '36', '38'],
  ARRAY['Black'],
  TRUE, TRUE, FALSE, 4.9, 201,
  'Premium blended fabric - Perfect fit guaranteed',
  'Machine wash cold. Hang dry. Iron on low heat.'
),

-- Red Button-Down Shirt
(
  'Crimson Button-Down Shirt',
  'crimson-button-down-shirt',
  'A striking crimson red button-down shirt with dual front pockets and meticulous stitching. The rich, saturated color and structured fit make this a standout piece for both casual and semi-formal occasions.',
  2199.00,
  3199.00,
  (SELECT id FROM categories WHERE slug = 'shirts'),
  ARRAY['/images/products/red-shirt.jpg'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['Crimson Red'],
  TRUE, FALSE, FALSE, 4.4, 52,
  '100% Premium Cotton',
  'Machine wash cold. Iron on medium heat.'
),

-- Pink Floral Embroidered Dress
(
  'Bloom Embroidered Summer Dress',
  'bloom-embroidered-summer-dress',
  'An enchanting lilac-pink summer dress adorned with delicate floral embroidery along the hemline. Features wide straps, a fitted bodice, and a graceful A-line skirt. Crafted from premium soft fabric for all-day comfort.',
  3999.00,
  5499.00,
  (SELECT id FROM categories WHERE slug = 'dresses'),
  ARRAY['/images/products/pink-floral-dress.jpg'],
  ARRAY['XS', 'S', 'M', 'L', 'XL'],
  ARRAY['Lilac Pink'],
  TRUE, TRUE, TRUE, 4.9, 87,
  'Premium Cotton Blend with hand-embroidered detailing',
  'Hand wash cold recommended. Iron on low heat. Do not bleach.'
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
