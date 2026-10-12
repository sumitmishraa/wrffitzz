import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const normalizeUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'your_supabase_url_here') return null;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}.supabase.co`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
};

const normalizedUrl = normalizeUrl(rawUrl);

const isConfigured = Boolean(
  normalizedUrl &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your_supabase_anon_key_here'
);

// Create a single supabase client for the app
export const supabase = isConfigured
  ? createClient(normalizedUrl, supabaseAnonKey)
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => isConfigured;
