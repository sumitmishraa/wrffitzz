// Fetch helper for the admin. The session is an httpOnly cookie, so requests
// only need to be same-origin. Errors carry the HTTP status (401 = signed out).
export async function adminRequest(url, { method = 'GET', body, form } = {}) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status}).`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const ORDER_STATUS_LABELS = {
  confirmed: 'Confirmed',
  packing: 'Packing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const PAYMENT_STATUS_LABELS = {
  PENDING_COD: 'Cash due on delivery',
  COD_COLLECTED: 'Cash collected',
  PAID: 'Paid online',
  REFUNDED: 'Refunded',
  FAILED: 'Payment failed',
};

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
