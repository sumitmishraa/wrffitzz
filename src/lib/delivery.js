// wrfitzz delivers inside Bangalore only. Shared by the product page
// delivery check and checkout.
const RANGES = [
  [560001, 560117],
  [561101, 561230],
  [562101, 562165],
];

export function cleanPincode(pin) {
  return String(pin || '').replace(/\D/g, '');
}

export function isBangalorePincode(pin) {
  const clean = cleanPincode(pin);
  if (clean.length !== 6) return false;
  const n = Number(clean);
  return RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

// Dispatch within 24h, delivered in about three days, never on a Sunday.
export function estimateDelivery(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 3);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}
