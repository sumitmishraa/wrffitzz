import { NextResponse } from 'next/server';
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from '@/lib/data-store';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

function fail(err) {
  const status = err?.status || 500;
  if (status >= 500) console.error('Products API error:', err);
  return NextResponse.json({ error: err?.message || 'Something went wrong.' }, { status });
}

const unauthorized = () =>
  NextResponse.json({ error: 'Sign in to the admin to do this.' }, { status: 401 });

// Public: visible products only. Admin with ?all=1: every product, including switched-off ones.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('all') === '1' && isAuthorizedAdmin(request);
    let products = await getStoreProducts({ includeHidden });

    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');
    if (category) {
      products = products.filter((p) =>
        p.category?.slug === category ||
        p.category_id === category ||
        (category === 'best-seller' && p.is_bestseller)
      );
    }
    if (gender) products = products.filter((p) => p.gender === gender || p.gender === 'unisex');
    if (search) {
      const q = search.toLowerCase();
      products = products.filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return NextResponse.json(products);
  } catch (err) {
    return fail(err);
  }
}

// Admin: add a product
export async function POST(request) {
  if (!isAuthorizedAdmin(request)) return unauthorized();
  try {
    const product = await createStoreProduct(await request.json());
    return NextResponse.json({ success: true, product });
  } catch (err) {
    return fail(err);
  }
}

// Admin: change any fields of a product (?id=...)
export async function PATCH(request) {
  if (!isAuthorizedAdmin(request)) return unauthorized();
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });
    const product = await updateStoreProduct(id, await request.json());
    return NextResponse.json({ success: true, product });
  } catch (err) {
    return fail(err);
  }
}

// Admin: delete a product (?id=...)
export async function DELETE(request) {
  if (!isAuthorizedAdmin(request)) return unauthorized();
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });
    await deleteStoreProduct(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return fail(err);
  }
}
