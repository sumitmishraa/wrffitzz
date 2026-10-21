import { NextResponse } from 'next/server';
import { getStoreCategories } from '@/lib/data-store';

export async function GET() {
  try {
    return NextResponse.json(await getStoreCategories());
  } catch (err) {
    console.error('Categories API error:', err);
    return NextResponse.json({ error: 'Could not load categories.' }, { status: 500 });
  }
}
