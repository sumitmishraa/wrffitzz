// Product photos uploaded in the admin are served from Supabase Storage.
function supabaseImageHost() {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  if (!raw || raw.startsWith('your')) return null;
  try {
    return new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}.supabase.co`).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'everdion.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(supabaseHost
        ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
        : []),
    ],
  },
};

export default nextConfig;
