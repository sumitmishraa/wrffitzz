/**
 * Supabase Synchronization Script
 * Run with: node scripts/sync-supabase.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.trim().split('=');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = vals.join('=').trim();
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = vals.join('=').trim();
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('⚠️ Supabase credentials missing in .env.local');
  process.exit(0);
}

// Normalize URL
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function sync() {
  try {
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
      console.log(`Found ${products.length} products to sync.`);

      for (const p of products) {
        const { error } = await supabase.from('products').upsert({
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          compare_price: p.compare_price,
          images: p.images,
          sizes: p.sizes,
          colors: p.colors?.map(c => typeof c === 'string' ? c : c.name),
          in_stock: p.in_stock,
          is_featured: p.is_featured,
          is_new: p.is_new,
          material: p.material,
          care_instructions: p.care_instructions,
        }, { onConflict: 'slug' });

        if (error) {
          console.warn(`Could not sync product ${p.name}:`, error.message);
        } else {
          console.log(`✓ Synced product: ${p.name}`);
        }
      }
    }

    console.log('Supabase sync check complete.');
  } catch (err) {
    console.error('Sync failed:', err.message);
  }
}

sync();
