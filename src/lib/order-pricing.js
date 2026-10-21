import 'server-only';
import { getStoreProducts, StoreError } from './data-store';

const MAX_QTY = 10;

// Rebuilds the order lines from the product store so names, prices and
// images never come from the browser. Hidden or sold-out pieces are refused.
export async function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new StoreError('Your bag is empty or too large.');
  }
  const products = await getStoreProducts();
  const lines = items.map((item) => {
    const id = item?.product_id ?? item?.id;
    const quantity = Number(item?.quantity);
    const product = products.find((p) => p.id === id);
    if (!product) throw new StoreError('One of the pieces in your bag is no longer available.');
    if (product.in_stock === false) throw new StoreError(`${product.name} is sold out.`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      throw new StoreError(`Quantities must be between 1 and ${MAX_QTY}.`);
    }
    const size = String(item?.size || '').slice(0, 20);
    if (product.sizes?.length && !product.sizes.includes(size)) {
      throw new StoreError(`Size ${size || '(none)'} is not available for ${product.name}.`);
    }
    return {
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      quantity,
      size,
      color: String(item?.color || product.colors?.[0]?.name || 'Standard').slice(0, 60),
      image: product.images?.[0] || '',
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  return { lines, subtotal };
}
