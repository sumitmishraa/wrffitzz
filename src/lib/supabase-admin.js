import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client with the service-role key. It bypasses row level
// security, so it must never be imported by a client component. The shop_*
// tables have RLS on and no public policies: only this client can read or write them.

export const PRODUCT_IMAGES_BUCKET = 'product-images';

function normalizeUrl(raw) {
  const value = (raw || '').trim();
  if (!value || value.startsWith('your')) return null;
  if (!/^https?:\/\//.test(value)) return `https://${value}.supabase.co`;
  return value;
}

const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const supabaseAdmin =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

// True when the database can be used for reads and writes.
export function isDatabaseConfigured() {
  return Boolean(supabaseAdmin);
}
