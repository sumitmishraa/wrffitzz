import crypto from 'crypto';

// Owner login for /admin. The password is ADMIN_SECRET_KEY; after a correct
// login the server sets an httpOnly cookie holding an expiry time signed with
// that key. API routes check the signature, so the password itself never
// travels again and cannot be read by page scripts.

export const ADMIN_COOKIE = 'wrf_admin';
const SESSION_SECONDS = 60 * 60 * 12; // 12 hours
const PUBLISHED_DEFAULT = 'wrfitzz@2026'; // printed in old docs; never accepted in production
const MIN_LENGTH = 12;

// Returns the usable secret, or null when admin access must stay closed.
export function getAdminSecret() {
  const secret = (process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD || '').trim();
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === PUBLISHED_DEFAULT || secret.length < MIN_LENGTH) return null;
    return secret;
  }
  return secret || PUBLISHED_DEFAULT; // local development only
}

export function adminSetupProblem() {
  if (getAdminSecret()) return null;
  return `Admin is locked: set ADMIN_SECRET_KEY to a private password of at least ${MIN_LENGTH} characters.`;
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(password) {
  const secret = getAdminSecret();
  return Boolean(secret && password && safeEqual(password, secret));
}

export function createSessionCookie() {
  const secret = getAdminSecret();
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const value = `${expires}.${sign(String(expires), secret)}`;
  return {
    name: ADMIN_COOKIE,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_SECONDS,
    },
  };
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function isAuthorizedAdmin(request) {
  try {
    const secret = getAdminSecret();
    if (!secret) return false;
    const value = readCookie(request, ADMIN_COOKIE);
    if (!value) return false;
    const [expires, signature] = value.split('.');
    if (!expires || !signature) return false;
    if (Number(expires) * 1000 < Date.now()) return false;
    return safeEqual(signature, sign(expires, secret));
  } catch {
    return false;
  }
}
