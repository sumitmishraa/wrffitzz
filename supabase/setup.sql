-- =====================================================================
-- wrfitzz · Supabase setup for the admin panel
-- Run once in Supabase > SQL Editor > New query. Safe to run again.
--
-- Creates the shop_* tables the store and admin read and write, a public
-- bucket for product photos, seeds the current catalogue, and removes the
-- old policies that let anyone read or edit customer orders.
-- The shop_* tables have row level security ON and no public policies:
-- only the server (SUPABASE_SERVICE_ROLE_KEY) can read or write them.
-- =====================================================================

create table if not exists public.shop_categories (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort_order integer not null default 0
);

create table if not exists public.shop_products (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  compare_price integer check (compare_price >= 0),
  category_id text references public.shop_categories(id) on delete set null,
  gender text not null default 'unisex',
  images jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  in_stock boolean not null default true,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  rating numeric(2,1),
  review_count integer not null default 0,
  material text not null default '',
  care_instructions text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_orders (
  id text primary key,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  shipping_address text,
  city text,
  state text,
  pincode text,
  items jsonb not null default '[]'::jsonb,
  subtotal integer,
  shipping integer,
  discount integer,
  total_amount numeric(10,2) not null,
  payment_method text,
  payment_status text,
  status text not null default 'confirmed',
  tracking_number text not null default '',
  courier text not null default '',
  estimated_delivery text not null default '',
  admin_notes text not null default '',
  history jsonb not null default '[]'::jsonb,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_orders_created_idx on public.shop_orders (created_at desc);
create index if not exists shop_orders_status_idx on public.shop_orders (status);
create index if not exists shop_products_visible_idx on public.shop_products (is_visible);

-- Store contact details (admin > Store details): one row, id 'store'.
create table if not exists public.shop_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shop_categories enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_settings enable row level security;

-- Product photos: anyone can view, only the server can upload (5 MB, images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The old orders tables let anyone with the public key read and edit customer
-- names, phones and addresses. Remove those policies if the tables exist.
do $$
begin
  if to_regclass('public.orders') is not null then
    execute 'drop policy if exists "Allow public read orders" on public.orders';
    execute 'drop policy if exists "Allow public update orders" on public.orders';
  end if;
  if to_regclass('public.order_items') is not null then
    execute 'drop policy if exists "Allow public read order_items" on public.order_items';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Seed: the current catalogue (skipped for rows that already exist)
-- ---------------------------------------------------------------------
insert into public.shop_categories (id, slug, name, description, image_url, sort_order) values
  ('cat-shirts', 'shirts', 'Shirts', 'Artisan embroidered and tailored casual shirts for the modern wardrobe.', '/images/products/geometric-shirt-front.jpg', 0),
  ('cat-trousers', 'trousers', 'Trousers', 'Impeccably tailored trousers with relaxed, versatile draping.', '/images/products/gray-trousers.jpg', 1),
  ('cat-dresses', 'dresses', 'Dresses', 'Handcrafted embroidered dresses and elegant silhouettes.', '/images/products/pink-floral-dress.jpg', 2),
  ('cat-accessories', 'accessories', 'Accessories', 'Curated pocket square sets and wardrobe essentials.', '/images/products/paisley-squares.jpg', 3),
  ('cat-bestseller', 'best-seller', 'Bestsellers', 'Our most sought-after signature pieces.', '/images/products/geometric-shirt-combo.jpg', 4)
on conflict (id) do nothing;

insert into public.shop_products (id, slug, name, description, price, compare_price, category_id, gender, images, sizes, colors, in_stock, is_visible, is_featured, is_new, is_bestseller, rating, review_count, material, care_instructions, sort_order) values
  ('prod-geometric-shirt', 'artisan-geometric-print-shirt', 'Artisan Geometric Print Shirt', 'A masterfully crafted shirt featuring hand-embroidered geometric motifs in black and tan on premium white cotton. The intricate pixel-art inspired patterns create a contemporary yet timeless aesthetic. Perfect for smart-casual and elevated evening occasions.', 2999, 4499, 'cat-shirts', 'men', '["/images/products/geometric-shirt-combo.jpg","/images/products/geometric-shirt-front.jpg","/images/products/geometric-shirt-back.jpg"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '[{"name":"White & Tan","hex":"#E4E0D4","image":"/images/products/geometric-shirt-combo.jpg"}]'::jsonb, true, true, true, true, true, 4.9, 124, '100% Premium Long-Staple Cotton with Embroidered Detailing', 'Machine wash cold. Do not bleach. Iron on low heat.', 0),
  ('prod-tailored-gray-trousers', 'premium-tailored-gray-trousers', 'Premium Tailored Gray Trousers', 'Impeccably tailored trousers in sophisticated slate gray. Crafted from breathable, lightweight fabric with clean pressed front creases, side welt pockets, and a classic straight-leg cut for an effortlessly polished look.', 1999, 2999, 'cat-trousers', 'men', '["/images/products/gray-trousers.jpg","/images/products/dual-trousers.jpg"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb, '[{"name":"Slate Gray","hex":"#757270","image":"/images/products/gray-trousers.jpg"}]'::jsonb, true, true, true, false, true, 4.8, 89, 'Poly-Viscose Blended Gabardine with shape retention', 'Machine wash cold. Hang dry. Iron as needed.', 1),
  ('prod-check-flannel-shirt', 'heritage-check-flannel-shirt', 'Heritage Check Flannel Shirt', 'A bold navy and white check pattern shirt crafted from soft, brushed cotton flannel. The timeless plaid design pairs effortlessly with denim or tailored trousers. Features button-down collar and relaxed fit for everyday comfort.', 2499, 3499, 'cat-shirts', 'men', '["/images/products/check-shirt-front.jpg","/images/products/check-shirt-back.jpg"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '[{"name":"Navy & White Check","hex":"#151b54","image":"/images/products/check-shirt-front.jpg"}]'::jsonb, true, true, true, true, false, 4.7, 67, '100% Brushed Cotton Flannel', 'Machine wash cold. Do not bleach. Hang dry recommended.', 2),
  ('prod-noir-classic-trousers', 'noir-classic-trousers', 'Noir Classic Tailored Trousers', 'The definitive deep black trouser. Cut from premium crease-resistant fabric with breathable construction and an impeccable drape. Features tailored waistband and elegant clean silhouette.', 2299, 3299, 'cat-trousers', 'men', '["/images/products/black-trousers.jpg","/images/products/dual-trousers.jpg"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb, '[{"name":"Noir Black","hex":"#2B2B28","image":"/images/products/black-trousers.jpg"}]'::jsonb, true, true, true, false, true, 4.9, 201, 'Premium blended woven fabric - Perfect drape guaranteed', 'Machine wash cold. Hang dry in shade.', 3),
  ('prod-essential-duo-trousers', 'essential-duo-trouser-set', 'Essential Duo Trouser Set', 'Two pairs of impeccably tailored trousers in classic noir black and slate gray. Crafted from breathable, durable fabric with versatile styling options for the modern wardrobe.', 3499, 4999, 'cat-trousers', 'men', '["/images/products/dual-trousers.jpg","/images/products/gray-trousers.jpg","/images/products/black-trousers.jpg"]'::jsonb, '["28","30","32","34","36","38"]'::jsonb, '[{"name":"Noir + Slate Gray","hex":"#2B2B28","image":"/images/products/dual-trousers.jpg"}]'::jsonb, true, true, true, false, true, 4.8, 156, 'Double-pack tailored gabardine blend', 'Machine wash cold. Iron on medium heat.', 4),
  ('prod-brave-graphic-shirt', 'bold-brave-graphic-shirt', 'Bold "Brave" Graphic Shirt', 'Make a statement with this vibrant crimson red shirt featuring an exclusive back-panel "BRAVE" art graphic. The artistic print adds a streetwear edge to a structured button-down silhouette.', 2799, 3999, 'cat-shirts', 'men', '["/images/products/red-brave-shirt.jpg","/images/products/red-shirt.jpg"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '[{"name":"Terracotta Crimson","hex":"#B55941","image":"/images/products/red-brave-shirt.jpg"}]'::jsonb, true, true, false, true, false, 4.6, 38, '100% Cotton Twill with Screen-Printed Graphic', 'Turn inside out before washing. Machine wash cold.', 5),
  ('prod-crimson-button-shirt', 'crimson-button-down-shirt', 'Crimson Button-Down Twill Shirt', 'A striking crimson twill button-down shirt with dual flap chest pockets and meticulous topstitching. The rich, saturated tone and structured fit make this a standout piece for all seasons.', 2199, 3199, 'cat-shirts', 'men', '["/images/products/red-shirt.jpg","/images/products/red-brave-shirt.jpg"]'::jsonb, '["S","M","L","XL","XXL"]'::jsonb, '[{"name":"Deep Crimson","hex":"#98432E","image":"/images/products/red-shirt.jpg"}]'::jsonb, true, true, false, false, false, 4.5, 52, '100% Premium Cotton Heavy Twill', 'Machine wash cold. Iron on medium heat.', 6),
  ('prod-bloom-dress', 'bloom-embroidered-summer-dress', 'Bloom Embroidered Summer Dress', 'An enchanting lilac-pink summer dress adorned with delicate floral embroidery along the hemline. Features wide shoulder straps, a fitted bodice, and a graceful A-line drape.', 3999, 5499, 'cat-dresses', 'women', '["/images/products/pink-floral-dress.jpg"]'::jsonb, '["XS","S","M","L","XL"]'::jsonb, '[{"name":"Lilac Pink","hex":"#ECC5C0","image":"/images/products/pink-floral-dress.jpg"}]'::jsonb, true, true, true, true, true, 4.9, 87, 'Premium Cotton Blend with Hand-Embroidered Hem', 'Hand wash cold recommended. Iron on low heat.', 7),
  ('prod-paisley-squares', 'artisan-paisley-pocket-square-set', 'Artisan Paisley Pocket Square Set', 'A curated collection of three handcrafted paisley pocket squares in jewel tones: emerald green, teal blue, and navy. Each piece features intricate motifs printed on soft, rolled-edge woven cotton.', 1299, 1899, 'cat-accessories', 'unisex', '["/images/products/paisley-squares.jpg"]'::jsonb, '["One Size"]'::jsonb, '[{"name":"Jewel Paisley","hex":"#B55941","image":"/images/products/paisley-squares.jpg"}]'::jsonb, true, true, false, true, false, 4.9, 43, '100% Premium Printed Cotton', 'Hand wash cold. Iron on medium heat.', 8)
on conflict (id) do nothing;

insert into public.shop_settings (id, data) values
  ('store', '{"whatsapp_number":"919845000000","contact_phone":"919845000000","contact_email":"care@wrfitzz.in","store_address":"Indiranagar, Bangalore, Karnataka","store_hours":"Monday to Saturday, 10am to 8pm","instagram_url":""}'::jsonb)
on conflict (id) do nothing;

-- Done. Refresh /admin: orders, products and store details now save here.
