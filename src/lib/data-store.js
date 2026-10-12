import fs from 'fs';
import path from 'path';
import { fallbackProducts, fallbackCategories } from './fallback-data';
import { supabase, isSupabaseConfigured } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initial sample orders for demonstration and immediate order tracking
const initialOrders = [
  {
    id: 'WRF-892104',
    customer_name: 'Aditya Rao',
    customer_email: 'aditya.rao@bangalore.io',
    customer_phone: '98450 12398',
    shipping_address: 'Villa 14, Prestige Ozone, Whitefield Main Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560066',
    subtotal: 4998,
    shipping: 0,
    total_amount: 4998,
    payment_method: 'UPI',
    payment_status: 'PAID',
    status: 'out_for_delivery',
    trackingNumber: 'BLR-EXP-892104',
    estimatedDelivery: 'Today by 5:00 PM',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    items: [
      {
        product_id: 'prod-geometric-shirt',
        name: 'Artisan Geometric Print Shirt',
        quantity: 1,
        size: 'L',
        color: 'White & Tan',
        price: 2999,
        image: '/images/products/geometric-shirt-combo.jpg',
      },
      {
        product_id: 'prod-tailored-gray-trousers',
        name: 'Premium Tailored Gray Trousers',
        quantity: 1,
        size: '32',
        color: 'Slate Gray',
        price: 1999,
        image: '/images/products/gray-trousers.jpg',
      },
    ],
    admin_notes: 'Customer requested gate delivery at security if away.',
  },
  {
    id: 'WRF-784512',
    customer_name: 'Ananya Deshmukh',
    customer_email: 'ananya.d@gmail.com',
    customer_phone: '97412 88410',
    shipping_address: 'Apartment 304, Brigade Gateway, Dr Rajkumar Road, Rajajinagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560055',
    subtotal: 2499,
    shipping: 0,
    total_amount: 2499,
    payment_method: 'CARD',
    payment_status: 'PAID',
    status: 'packing',
    trackingNumber: 'BLR-EXP-784512',
    estimatedDelivery: 'Tomorrow by 2:00 PM',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    items: [
      {
        product_id: 'prod-check-flannel-shirt',
        name: 'Heritage Check Flannel Shirt',
        quantity: 1,
        size: 'M',
        color: 'Navy & White Check',
        price: 2499,
        image: '/images/products/check-shirt-front.jpg',
      },
    ],
    admin_notes: 'Priority gift box packaging requested.',
  },
  {
    id: 'WRF-651290',
    customer_name: 'Vikram Sundaram',
    customer_email: 'vikram.s@outlook.com',
    customer_phone: '99001 54321',
    shipping_address: 'Flat 12B, Salarpuria Sattva Magnificia, Old Madras Road, Indiranagar Extn',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    subtotal: 3998,
    shipping: 0,
    total_amount: 3998,
    payment_method: 'COD',
    payment_status: 'PENDING_COD',
    status: 'confirmed',
    trackingNumber: 'BLR-EXP-651290',
    estimatedDelivery: 'Oct 13, 2026',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      {
        product_id: 'prod-dual-tone-trouser',
        name: 'Dual-Tone Pleated Street Trouser',
        quantity: 2,
        size: '34',
        color: 'Charcoal & Sand',
        price: 1999,
        image: '/images/products/dual-trousers.jpg',
      },
    ],
    admin_notes: 'Cash on delivery verification completed over phone.',
  },
];

// ============================================
// PRODUCTS STORE
// ============================================
export function getStoreProducts() {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(fallbackProducts, null, 2), 'utf-8');
      return fallbackProducts;
    }
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackProducts;
  } catch (err) {
    console.error('Error reading products.json:', err);
    return fallbackProducts;
  }
}

export function saveStoreProducts(products) {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving products.json:', err);
    return false;
  }
}

export function saveStoreProduct(productData) {
  const products = getStoreProducts();
  const index = products.findIndex(p => p.id === productData.id);

  let saved;
  if (index >= 0) {
    // Update existing
    products[index] = { ...products[index], ...productData, updated_at: new Date().toISOString() };
    saved = products[index];
  } else {
    // Insert new
    const newProduct = {
      ...productData,
      id: productData.id || `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    products.unshift(newProduct);
    saved = newProduct;
  }

  saveStoreProducts(products);

  // Background sync to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      supabase.from('products').upsert({
        name: saved.name,
        slug: saved.slug,
        description: saved.description,
        price: saved.price,
        compare_price: saved.compare_price,
        images: saved.images,
        sizes: saved.sizes,
        colors: saved.colors?.map(c => typeof c === 'string' ? c : c.name),
        in_stock: saved.in_stock,
        is_featured: saved.is_featured,
        is_new: saved.is_new,
        material: saved.material,
        care_instructions: saved.care_instructions,
      }, { onConflict: 'slug' }).then(({ error }) => {
        if (error) console.warn('Supabase product sync notice:', error.message);
      }).catch(e => console.warn('Supabase sync exception:', e));
    } catch (e) {
      // ignore
    }
  }

  return saved;
}

export function deleteStoreProduct(id) {
  const products = getStoreProducts();
  const target = products.find(p => p.id === id);
  const filtered = products.filter(p => p.id !== id);
  saveStoreProducts(filtered);

  // Background sync delete to Supabase if configured
  if (target && isSupabaseConfigured() && supabase) {
    try {
      supabase.from('products').delete().eq('slug', target.slug).catch(() => {});
    } catch (e) {
      // ignore
    }
  }

  return filtered;
}

// ============================================
// ORDERS STORE
// ============================================
export function getStoreOrders() {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(initialOrders, null, 2), 'utf-8');
      return initialOrders;
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : initialOrders;
  } catch (err) {
    console.error('Error reading orders.json:', err);
    return initialOrders;
  }
}

export function saveStoreOrders(orders) {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving orders.json:', err);
    return false;
  }
}

export function createStoreOrder(orderData) {
  const orders = getStoreOrders();
  const newOrder = {
    ...orderData,
    id: orderData.id || `WRF-${Date.now().toString().slice(-6)}`,
    status: orderData.status || 'confirmed',
    trackingNumber: orderData.trackingNumber || `BLR-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
    created_at: orderData.created_at || new Date().toISOString(),
  };
  orders.unshift(newOrder);
  saveStoreOrders(orders);

  // Background sync to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      supabase.from('orders').insert({
        customer_name: newOrder.customer_name,
        customer_email: newOrder.customer_email,
        customer_phone: newOrder.customer_phone,
        shipping_address: newOrder.shipping_address,
        city: newOrder.city || 'Bangalore',
        state: newOrder.state || 'Karnataka',
        pincode: newOrder.pincode,
        total_amount: newOrder.total_amount,
        status: newOrder.status,
      }).select().single().then(({ data: orderRow, error: orderErr }) => {
        if (!orderErr && orderRow && Array.isArray(newOrder.items)) {
          const itemsRows = newOrder.items.map(it => ({
            order_id: orderRow.id,
            product_name: it.name,
            quantity: it.quantity || 1,
            size: it.size || 'M',
            color: it.color || 'Standard',
            price: it.price || 0,
            image_url: it.image || '',
          }));
          supabase.from('order_items').insert(itemsRows).catch(() => {});
        }
      }).catch(e => console.warn('Supabase order sync notice:', e));
    } catch (e) {
      // ignore
    }
  }

  return newOrder;
}

export function updateStoreOrder(id, updates) {
  const orders = getStoreOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index >= 0) {
    orders[index] = { ...orders[index], ...updates, updated_at: new Date().toISOString() };
    saveStoreOrders(orders);

    // Background sync update to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        if (updates.status) {
          supabase.from('orders').update({ status: updates.status }).eq('id', id).catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    }

    return orders[index];
  }
  return null;
}

// ============================================
// CATEGORIES STORE
// ============================================
export function getStoreCategories() {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(CATEGORIES_FILE)) {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(fallbackCategories, null, 2), 'utf-8');
      return fallbackCategories;
    }
    const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return fallbackCategories;
  }
}
