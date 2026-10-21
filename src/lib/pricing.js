// One pricing rule for the whole store: bag drawer, /cart, checkout, payment,
// the WhatsApp order text and the server-side Razorpay amount.

export const FREE_DELIVERY_OVER = 1999;
export const DELIVERY_FEE = 99;
export const PREPAID_DISCOUNT = 0.1;

export function computeTotals(subtotal, { prepaid = false } = {}) {
  const sub = Math.max(0, Math.round(Number(subtotal) || 0));
  const delivery = sub === 0 || sub >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const discount = prepaid ? Math.round(sub * PREPAID_DISCOUNT) : 0;
  return {
    subtotal: sub,
    delivery,
    discount,
    total: Math.max(0, sub + delivery - discount),
    freeDeliveryRemaining: Math.max(0, FREE_DELIVERY_OVER - sub),
  };
}

export function subtotalOf(items = []) {
  return items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
}

export function formatINR(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
}
