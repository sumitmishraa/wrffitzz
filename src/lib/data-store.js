import 'server-only';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fallbackProducts, fallbackCategories } from './fallback-data';
import { supabaseAdmin, isDatabaseConfigured } from './supabase-admin';

// One store, two backends. With SUPABASE_SERVICE_ROLE_KEY set, everything lives
// in Supabase (shop_products, shop_orders, shop_categories). Without it, the
// JSON files in src/data are used, which works locally but not on Vercel,
// where the filesystem is read-only.

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

export const ORDER_STATUSES = ['confirmed', 'packing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
export const PAYMENT_STATUSES = ['PENDING_COD', 'PAID', 'COD_COLLECTED', 'REFUNDED', 'FAILED'];

export class StoreError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function storeMode() {
  return isDatabaseConfigured() ? 'database' : 'files';
}

// ---------- file helpers ----------
function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (err) {
    console.error(`Could not read ${path.basename(file)}:`, err.message);
    return fallback;
  }
}

function writeJson(file, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    throw new StoreError(
      'Changes cannot be saved: the database is not connected and this server cannot write files. Add SUPABASE_SERVICE_ROLE_KEY.',
      503
    );
  }
}

function dbError(error, action) {
  console.error(`Supabase ${action} failed:`, error.message);
  return new StoreError(`Database error while trying to ${action}: ${error.message}`, 500);
}

// ---------- sanitising ----------
const str = (v, max = 2000) => (v == null ? '' : String(v).trim().slice(0, max));
const money = (v, field) => {
  if (v === '' || v == null) return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0) throw new StoreError(`${field} must be a positive number.`);
  return n;
};
const strList = (v, max = 30) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, 500)).filter(Boolean).slice(0, max);

export function slugify(text) {
  return str(text, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const PRODUCT_FIELDS = {
  name: (v) => {
    const s = str(v, 140);
    if (!s) throw new StoreError('Product name is required.');
    return s;
  },
  slug: (v) => slugify(v),
  description: (v) => str(v, 4000),
  price: (v) => {
    const n = money(v, 'Price');
    if (n == null) throw new StoreError('Price is required.');
    return n;
  },
  compare_price: (v) => money(v, 'Compare-at price'),
  category_id: (v) => str(v, 80) || null,
  gender: (v) => (['men', 'women', 'unisex'].includes(v) ? v : 'unisex'),
  images: (v) => strList(v, 12),
  sizes: (v) => strList(v, 20),
  colors: (v) =>
    (Array.isArray(v) ? v : [])
      .map((c) => (typeof c === 'string'
        ? { name: str(c, 60), hex: '#CBCED3' }
        : { name: str(c?.name, 60), hex: /^#[0-9a-f]{6}$/i.test(c?.hex) ? c.hex : '#CBCED3', image: str(c?.image, 500) || undefined }))
      .filter((c) => c.name)
      .slice(0, 12),
  in_stock: (v) => Boolean(v),
  is_visible: (v) => Boolean(v),
  is_featured: (v) => Boolean(v),
  is_new: (v) => Boolean(v),
  is_bestseller: (v) => Boolean(v),
  material: (v) => str(v, 400),
  care_instructions: (v) => str(v, 400),
};

function cleanProduct(input, { partial = false } = {}) {
  const out = {};
  for (const [key, clean] of Object.entries(PRODUCT_FIELDS)) {
    if (input[key] === undefined) {
      if (!partial && (key === 'name' || key === 'price')) out[key] = clean(undefined);
      continue;
    }
    out[key] = clean(input[key]);
  }
  return out;
}

// ---------- categories ----------
export async function getStoreCategories() {
  if (isDatabaseConfigured()) {
    const { data, error } = await supabaseAdmin.from('shop_categories').select('*').order('sort_order');
    if (!error && data?.length) return data;
    if (error) console.error('Supabase categories read failed:', error.message);
  }
  return readJson(CATEGORIES_FILE, fallbackCategories);
}

function withCategory(product, categories) {
  const cat = categories.find((c) => c.id === product.category_id);
  return {
    ...product,
    images: product.images || [],
    sizes: product.sizes || [],
    colors: product.colors || [],
    is_visible: product.is_visible !== false,
    category: cat ? { name: cat.name, slug: cat.slug } : product.category || null,
  };
}

// ---------- products ----------
// includeHidden: admins see products that are switched off.
export async function getStoreProducts({ includeHidden = false } = {}) {
  let rows;
  if (isDatabaseConfigured()) {
    const { data, error } = await supabaseAdmin
      .from('shop_products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase products read failed, using files:', error.message);
    } else {
      rows = data;
    }
  }
  if (!rows) rows = readJson(PRODUCTS_FILE, fallbackProducts);
  const categories = await getStoreCategories();
  const products = rows.map((p) => withCategory(p, categories));
  return includeHidden ? products : products.filter((p) => p.is_visible);
}

async function uniqueSlug(base, ignoreId) {
  const products = await getStoreProducts({ includeHidden: true });
  let slug = base || `piece-${Date.now()}`;
  let n = 2;
  while (products.some((p) => p.slug === slug && p.id !== ignoreId)) slug = `${base}-${n++}`;
  return slug;
}

export async function createStoreProduct(input) {
  const product = cleanProduct(input);
  product.slug = await uniqueSlug(product.slug || slugify(product.name));
  product.id = `prod-${product.slug}`.slice(0, 80);
  if (product.is_visible === undefined) product.is_visible = true;
  if (product.in_stock === undefined) product.in_stock = true;
  const now = new Date().toISOString();

  if (isDatabaseConfigured()) {
    const { data, error } = await supabaseAdmin
      .from('shop_products')
      .insert({ ...product, created_at: now, updated_at: now })
      .select()
      .single();
    if (error) throw dbError(error, 'add the product');
    return data;
  }
  const products = readJson(PRODUCTS_FILE, fallbackProducts);
  const saved = { ...product, created_at: now, updated_at: now };
  writeJson(PRODUCTS_FILE, [saved, ...products]);
  return saved;
}

export async function updateStoreProduct(id, patch) {
  const changes = cleanProduct(patch, { partial: true });
  if (changes.slug !== undefined) changes.slug = await uniqueSlug(changes.slug, id);
  changes.updated_at = new Date().toISOString();

  if (isDatabaseConfigured()) {
    const { data, error } = await supabaseAdmin.from('shop_products').update(changes).eq('id', id).select().maybeSingle();
    if (error) throw dbError(error, 'update the product');
    if (!data) throw new StoreError('Product not found.', 404);
    return data;
  }
  const products = readJson(PRODUCTS_FILE, fallbackProducts);
  const index = products.findIndex((p) => p.id === id);
  if (index < 0) throw new StoreError('Product not found.', 404);
  products[index] = { ...products[index], ...changes };
  writeJson(PRODUCTS_FILE, products);
  return products[index];
}

export async function deleteStoreProduct(id) {
  if (isDatabaseConfigured()) {
    const { error } = await supabaseAdmin.from('shop_products').delete().eq('id', id);
    if (error) throw dbError(error, 'delete the product');
    return true;
  }
  const products = readJson(PRODUCTS_FILE, fallbackProducts);
  writeJson(PRODUCTS_FILE, products.filter((p) => p.id !== id));
  return true;
}

// ---------- orders ----------
function normaliseOrder(o) {
  return {
    ...o,
    status: ORDER_STATUSES.includes(o.status) ? o.status : 'confirmed',
    tracking_number: o.tracking_number ?? o.trackingNumber ?? '',
    estimated_delivery: o.estimated_delivery ?? o.estimatedDelivery ?? '',
    created_at: o.created_at ?? o.createdAt ?? null,
    history: Array.isArray(o.history) ? o.history : [],
    items: Array.isArray(o.items) ? o.items : [],
  };
}

export async function getStoreOrders() {
  if (isDatabaseConfigured()) {
    const { data, error } = await supabaseAdmin.from('shop_orders').select('*').order('created_at', { ascending: false });
    if (error) throw dbError(error, 'load orders');
    return data.map(normaliseOrder);
  }
  return readJson(ORDERS_FILE, []).map(normaliseOrder);
}

function newOrderId() {
  return `WRF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const ORDER_INPUT = [
  'customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'city', 'state', 'pincode',
  'items', 'subtotal', 'shipping', 'discount', 'total_amount', 'payment_method', 'payment_status',
  'razorpay_order_id', 'razorpay_payment_id', 'estimated_delivery',
];

export async function createStoreOrder(input) {
  const now = new Date().toISOString();
  const order = { id: newOrderId(), status: 'confirmed', created_at: now, updated_at: now };
  for (const key of ORDER_INPUT) if (input[key] !== undefined) order[key] = input[key];
  order.tracking_number = '';
  order.history = [{ status: 'confirmed', at: now, note: order.payment_method === 'COD' ? 'Cash on delivery order placed' : 'Paid online' }];

  if (isDatabaseConfigured()) {
    const { data, error } = await supabaseAdmin.from('shop_orders').insert(order).select().single();
    if (error) throw dbError(error, 'save the order');
    return normaliseOrder(data);
  }
  const orders = readJson(ORDERS_FILE, []);
  writeJson(ORDERS_FILE, [order, ...orders]);
  return normaliseOrder(order);
}

const ORDER_EDITABLE = ['status', 'payment_status', 'tracking_number', 'courier', 'estimated_delivery', 'admin_notes'];

export async function updateStoreOrder(id, patch, note) {
  const orders = await getStoreOrders();
  const current = orders.find((o) => o.id === id);
  if (!current) throw new StoreError('Order not found.', 404);

  const changes = {};
  for (const key of ORDER_EDITABLE) {
    if (patch[key] === undefined) continue;
    changes[key] = str(patch[key], key === 'admin_notes' ? 2000 : 200);
  }
  if (changes.status && !ORDER_STATUSES.includes(changes.status)) throw new StoreError('Unknown order status.');
  if (changes.payment_status && !PAYMENT_STATUSES.includes(changes.payment_status)) throw new StoreError('Unknown payment status.');

  const now = new Date().toISOString();
  const history = [...current.history];
  if (changes.status && changes.status !== current.status) {
    history.push({ status: changes.status, at: now, note: str(note, 300) || undefined });
  } else if (note) {
    history.push({ status: current.status, at: now, note: str(note, 300) });
  }
  changes.history = history;
  changes.updated_at = now;

  if (isDatabaseConfigured()) {
    const { data, error } = await supabaseAdmin.from('shop_orders').update(changes).eq('id', id).select().single();
    if (error) throw dbError(error, 'update the order');
    return normaliseOrder(data);
  }
  const all = readJson(ORDERS_FILE, []);
  const index = all.findIndex((o) => o.id === id);
  all[index] = { ...all[index], ...changes };
  writeJson(ORDERS_FILE, all);
  return normaliseOrder(all[index]);
}
