import { NextResponse } from 'next/server';
import { getStoreProducts, saveStoreProduct, deleteStoreProduct } from '@/lib/data-store';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');
    const isBestseller = searchParams.get('bestseller');

    let products = getStoreProducts();

    if (category) {
      products = products.filter(p =>
        p.category?.slug === category ||
        p.category_id === category ||
        (category === 'best-seller' && p.is_bestseller)
      );
    }
    if (gender) {
      products = products.filter(p => p.gender === gender || p.gender === 'unisex');
    }
    if (isBestseller === 'true') {
      products = products.filter(p => p.is_bestseller);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized: Owner credentials required' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    // Auto-generate slug if missing
    if (!body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    const saved = saveStoreProduct(body);
    return NextResponse.json({ success: true, product: saved });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized: Owner credentials required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }
    const updated = deleteStoreProduct(id);
    return NextResponse.json({ success: true, products: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
