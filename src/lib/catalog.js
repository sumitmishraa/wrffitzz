import 'server-only';
import { getStoreProducts, getStoreCategories, getStoreSettings } from './data-store';

export async function getSettings() {
  return getStoreSettings();
}

// Server-side reads for the storefront pages. Products switched off in the
// admin (is_visible = false) never reach these.

export async function getCategories() {
  return getStoreCategories();
}

export async function getProducts({ category, featured, isNew, isBestseller, gender, limit, search } = {}) {
  let products = await getStoreProducts();

  if (category) {
    products = products.filter((p) =>
      p.category?.slug === category ||
      p.category_id === category ||
      (category === 'best-seller' && p.is_bestseller)
    );
  }
  if (featured) products = products.filter((p) => p.is_featured);
  if (isNew) products = products.filter((p) => p.is_new);
  if (isBestseller) products = products.filter((p) => p.is_bestseller);
  if (gender) products = products.filter((p) => p.gender === gender || p.gender === 'unisex');
  if (search) {
    const q = search.toLowerCase();
    products = products.filter((p) =>
      [p.name, p.description, p.category?.name, ...(p.colors || []).map((c) => c.name)]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(q))
    );
  }
  if (limit) products = products.slice(0, limit);
  return products;
}

export async function getProductBySlug(slug) {
  const products = await getStoreProducts();
  return products.find((p) => p.slug === slug || p.id === slug) || null;
}

export async function getRelatedProducts(categoryId, excludeId, limit = 4) {
  const products = await getStoreProducts();
  return products.filter((p) => p.category_id === categoryId && p.id !== excludeId).slice(0, limit);
}
