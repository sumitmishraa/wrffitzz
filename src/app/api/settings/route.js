import { NextResponse } from 'next/server';
import { getStoreSettings, updateStoreSettings } from '@/lib/data-store';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

function fail(err) {
  const status = err?.status || 500;
  if (status >= 500) console.error('Settings API error:', err);
  return NextResponse.json({ error: err?.message || 'Something went wrong.' }, { status });
}

// Public: the store's contact details are shown on the site anyway.
export async function GET() {
  try {
    return NextResponse.json(await getStoreSettings());
  } catch (err) {
    return fail(err);
  }
}

// Admin: change contact details
export async function PATCH(request) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: 'Sign in to the admin to do this.' }, { status: 401 });
  }
  try {
    const settings = await updateStoreSettings(await request.json());
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return fail(err);
  }
}
