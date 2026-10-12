// Admin Authentication & Security Helper
const DEFAULT_ADMIN_SECRET = 'wrfitzz@2026';

export function getAdminSecret() {
  return process.env.ADMIN_SECRET_KEY || process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_SECRET;
}

export function isAuthorizedAdmin(request) {
  try {
    const adminSecret = getAdminSecret();

    // Check header 'x-admin-token'
    const headerToken = request.headers.get('x-admin-token');
    if (headerToken && headerToken === adminSecret) {
      return true;
    }

    // Check Authorization: Bearer <token>
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token === adminSecret) {
        return true;
      }
    }

    // Check URL search parameter in special cases
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('admin_token');
    if (queryToken && queryToken === adminSecret) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}
