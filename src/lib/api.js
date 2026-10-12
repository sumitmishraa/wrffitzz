import { fallbackProducts, fallbackCategories } from './fallback-data';

// ============================================
// CATEGORIES
// ============================================
export async function getCategories() {
  if (typeof window === 'undefined') {
    try {
      const { getStoreCategories } = await import('./data-store');
      return getStoreCategories();
    } catch (e) {
      return fallbackCategories;
    }
  }
  return fallbackCategories;
}

// ============================================
// PRODUCTS
// ============================================
export async function getProducts({ category, featured, isNew, isBestseller, gender, limit, search } = {}) {
  let products = [];

  if (typeof window === 'undefined') {
    try {
      const { getStoreProducts } = await import('./data-store');
      products = getStoreProducts();
    } catch (e) {
      console.warn('Falling back to static products:', e);
      products = [...fallbackProducts];
    }
  } else {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        products = await res.json();
      } else {
        products = [...fallbackProducts];
      }
    } catch (e) {
      products = [...fallbackProducts];
    }
  }

  if (!Array.isArray(products) || products.length === 0) {
    products = [...fallbackProducts];
  }

  // Apply filters
  if (category) {
    products = products.filter(p =>
      p.category?.slug === category ||
      p.category_id === category ||
      p.category === category ||
      (category === 'best-seller' && p.is_bestseller)
    );
  }
  if (featured) products = products.filter(p => p.is_featured);
  if (isNew) products = products.filter(p => p.is_new);
  if (isBestseller) products = products.filter(p => p.is_bestseller);
  if (gender) products = products.filter(p => p.gender === gender || p.gender === 'unisex');
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q) ||
      p.colors?.some(c => c.name?.toLowerCase().includes(q))
    );
  }
  if (limit) products = products.slice(0, limit);

  return products;
}

export async function getProductBySlug(slug) {
  const products = await getProducts();
  return products.find(p => p.slug === slug || p.id === slug) || null;
}

export async function getRelatedProducts(categoryId, excludeId, limit = 4) {
  const products = await getProducts();
  return products
    .filter(p => (p.category_id === categoryId || p.category?.slug === categoryId) && p.id !== excludeId)
    .slice(0, limit);
}

// ============================================
// ORDERS
// ============================================
export async function createOrder(orderData) {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('API create order failed, saving locally:', err);
    }
  } else {
    try {
      const { createStoreOrder } = await import('./data-store');
      return createStoreOrder(orderData);
    } catch (err) {
      console.warn('Server create order error:', err);
    }
  }

  return {
    id: 'WRF-' + Date.now().toString().slice(-6),
    ...orderData,
    status: 'confirmed',
    trackingNumber: 'BLR-EXP-' + Math.floor(100000 + Math.random() * 900000),
    created_at: new Date().toISOString(),
  };
}
