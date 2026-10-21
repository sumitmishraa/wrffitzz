// Client-side helpers that talk to the API routes. Server components use
// lib/catalog.js instead, which reads the store directly.
import { fallbackProducts } from './fallback-data';

export async function getProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const products = await res.json();
      if (Array.isArray(products)) return products;
    }
  } catch {
    // network error: fall through
  }
  return [...fallbackProducts];
}

export async function createOrder(orderData) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'We could not place your order.');
  return data;
}
