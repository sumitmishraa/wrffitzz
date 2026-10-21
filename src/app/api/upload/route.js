import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { supabaseAdmin, isDatabaseConfigured, PRODUCT_IMAGES_BUCKET } from '@/lib/supabase-admin';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

// Checks the file's first bytes, so a renamed file of another type is refused.
function sniff(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buffer.slice(4, 12).toString().startsWith('ftypavi')) return 'image/avif';
  return null;
}

export async function POST(request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: 'Sign in to the admin to upload images.' }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Images must be 5 MB or smaller.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = sniff(buffer);
    if (!type) {
      return NextResponse.json({ error: 'Use a JPG, PNG, WebP or AVIF image.' }, { status: 400 });
    }

    const base = path
      .basename(file.name || 'product', path.extname(file.name || ''))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 40) || 'product';
    const name = `${base}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${TYPES[type]}`;

    if (isDatabaseConfigured()) {
      const { error } = await supabaseAdmin.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(`products/${name}`, buffer, { contentType: type, cacheControl: '31536000', upsert: false });
      if (error) {
        console.error('Supabase storage upload failed:', error.message);
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
      }
      const { data } = supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(`products/${name}`);
      return NextResponse.json({ success: true, url: data.publicUrl });
    }

    // Local development without the database: keep the old behaviour.
    try {
      const dir = path.join(process.cwd(), 'public', 'images', 'products');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), buffer);
      return NextResponse.json({ success: true, url: `/images/products/${name}` });
    } catch {
      return NextResponse.json(
        { error: 'Image storage is not connected. Add SUPABASE_SERVICE_ROLE_KEY and run the Supabase setup.' },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
