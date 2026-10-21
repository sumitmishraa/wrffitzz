import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  adminSetupProblem,
  checkPassword,
  createSessionCookie,
  isAuthorizedAdmin,
} from '@/lib/admin-auth';
import { storeMode } from '@/lib/data-store';

// Small per-instance brake on password guessing.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientKey(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
}

// Session status, used by the admin page on load.
export async function GET(request) {
  return NextResponse.json({
    authorized: isAuthorizedAdmin(request),
    setupProblem: adminSetupProblem(),
    storage: storeMode(),
  });
}

export async function POST(request) {
  const problem = adminSetupProblem();
  if (problem) return NextResponse.json({ authorized: false, error: problem }, { status: 503 });

  const key = clientKey(request);
  const now = Date.now();
  const record = attempts.get(key);
  if (record && now - record.first < WINDOW_MS && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { authorized: false, error: 'Too many attempts. Wait 15 minutes and try again.' },
      { status: 429 }
    );
  }

  const { password } = await request.json().catch(() => ({}));
  if (!checkPassword(password)) {
    const fresh = !record || now - record.first >= WINDOW_MS;
    attempts.set(key, { first: fresh ? now : record.first, count: fresh ? 1 : record.count + 1 });
    return NextResponse.json({ authorized: false, error: 'That password is not correct.' }, { status: 401 });
  }

  attempts.delete(key);
  const cookie = createSessionCookie();
  const response = NextResponse.json({ authorized: true, storage: storeMode() });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

// Sign out
export async function DELETE() {
  const response = NextResponse.json({ authorized: false });
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
