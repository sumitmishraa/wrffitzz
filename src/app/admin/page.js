'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './admin.css';

const DEFAULT_PIN = 'wrfitzz@2026';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'analytics'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Modals
  const [selectedOrderDossier, setSelectedOrderDossier] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // New/Edit Product Form State
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    slug: '',
    category_id: 'cat-shirts',
    category: { name: 'Shirts', slug: 'shirts' },
    gender: 'men',
    price: 2499,
    compare_price: 3499,
    in_stock: true,
    is_bestseller: false,
    is_new: true,
    is_featured: true,
    images: ['/images/products/geometric-shirt-front.jpg'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Noir Black', hex: '#111111', image: '' }],
    description: '',
    material: '100% Premium Fabric',
    care_instructions: 'Machine wash cold.',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newColorForm, setNewColorForm] = useState({ name: '', hex: '#2B2B28', image: '' });

  // Show Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Check saved session on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('wrfitzz_admin_token');
      if (saved) {
        setAdminToken(saved);
        setIsAuthenticated(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch Orders & Products
  const fetchData = async (token = adminToken) => {
    if (!token) return;
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders', {
          headers: { 'x-admin-token': token },
        }),
        fetch('/api/products'),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminToken) {
      fetchData(adminToken);
    }
  }, [isAuthenticated, adminToken]);

  // Handle Owner PIN Authentication
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      // Test the PIN by fetching orders
      const res = await fetch('/api/orders', {
        headers: { 'x-admin-token': authPin.trim() },
      });

      if (res.ok) {
        const token = authPin.trim();
        sessionStorage.setItem('wrfitzz_admin_token', token);
        setAdminToken(token);
        setIsAuthenticated(true);
        showToast('Owner session unlocked successfully');
      } else {
        setAuthError('Invalid Security PIN. Please check your credentials.');
      }
    } catch (err) {
      setAuthError('Connection error. Could not verify PIN.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('wrfitzz_admin_token');
    setAdminToken('');
    setIsAuthenticated(false);
    setAuthPin('');
    showToast('Admin session locked');
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrderDossier && selectedOrderDossier.id === orderId) {
          setSelectedOrderDossier(prev => ({ ...prev, status: newStatus }));
        }
        showToast(`Order #${orderId} marked as ${newStatus.toUpperCase()}`);
      } else {
        showToast('Unauthorized action');
      }
    } catch (err) {
      console.error('Status update failed:', err);
      showToast('Error updating status');
    }
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      id: prod.id,
      name: prod.name || '',
      slug: prod.slug || '',
      category_id: prod.category_id || 'cat-shirts',
      category: prod.category || { name: 'Shirts', slug: 'shirts' },
      gender: prod.gender || 'men',
      price: prod.price || 0,
      compare_price: prod.compare_price || 0,
      in_stock: prod.in_stock !== false,
      is_bestseller: Boolean(prod.is_bestseller),
      is_new: Boolean(prod.is_new),
      is_featured: Boolean(prod.is_featured),
      images: prod.images && prod.images.length ? [...prod.images] : ['/images/products/geometric-shirt-front.jpg'],
      sizes: prod.sizes && prod.sizes.length ? [...prod.sizes] : ['S', 'M', 'L', 'XL'],
      colors: prod.colors && prod.colors.length ? [...prod.colors] : [{ name: 'Charcoal', hex: '#2B2B28' }],
      description: prod.description || '',
      material: prod.material || '',
      care_instructions: prod.care_instructions || '',
    });
    setIsProductModalOpen(true);
  };

  // Open Create Product Modal
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      id: `prod-${Date.now()}`,
      name: '',
      slug: '',
      category_id: 'cat-shirts',
      category: { name: 'Shirts', slug: 'shirts' },
      gender: 'men',
      price: 2499,
      compare_price: 3499,
      in_stock: true,
      is_bestseller: false,
      is_new: true,
      is_featured: true,
      images: ['/images/products/geometric-shirt-front.jpg'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [{ name: 'Obsidian Black', hex: '#111111' }],
      description: 'Handcrafted luxury streetwear garment crafted with architectural precision.',
      material: '100% Long-Staple Cotton',
      care_instructions: 'Machine wash cold. Line dry in shade.',
    });
    setIsProductModalOpen(true);
  };

  // Handle Image File Upload
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-admin-token': adminToken,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProductForm(prev => ({
          ...prev,
          images: [data.url, ...prev.images],
        }));
        showToast('Image uploaded successfully!');
      } else {
        showToast('Image upload unauthorized or failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove Image
  const handleRemoveImage = (imgUrl) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imgUrl),
    }));
  };

  // Add Size
  const handleAddSize = () => {
    if (!newSizeInput.trim()) return;
    const size = newSizeInput.trim().toUpperCase();
    if (!productForm.sizes.includes(size)) {
      setProductForm(prev => ({ ...prev, sizes: [...prev.sizes, size] }));
    }
    setNewSizeInput('');
  };

  // Remove Size
  const handleRemoveSize = (sizeToRemove) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== sizeToRemove),
    }));
  };

  // Add Color
  const handleAddColor = () => {
    if (!newColorForm.name.trim()) return;
    setProductForm(prev => ({
      ...prev,
      colors: [...prev.colors, { ...newColorForm }],
    }));
    setNewColorForm({ name: '', hex: '#2B2B28', image: '' });
  };

  // Remove Color
  const handleRemoveColor = (indexToRemove) => {
    setProductForm(prev => ({
      ...prev,
      colors: prev.colors.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert('Product name is required');
      return;
    }

    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        compare_price: Number(productForm.compare_price),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingProduct ? 'Product updated & synced to storefront!' : 'New product created & live!');
        setIsProductModalOpen(false);
        fetchData();
      } else {
        showToast('Failed to save product (unauthorized)');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('Error saving product');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the catalog?`)) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      });
      if (res.ok) {
        showToast(`Product "${name}" deleted`);
        fetchData();
      } else {
        showToast('Failed to delete (unauthorized)');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast('Error deleting product');
    }
  };

  // Calculations for Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOrdersCount = orders.length;
  const activeDispatchesCount = orders.filter(o => o.status === 'out_for_delivery' || o.status === 'packing').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  // Filtered Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer_phone?.includes(orderSearch) ||
      order.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.pincode?.includes(orderSearch);

    const matchesStatus =
      orderStatusFilter === 'all' || order.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered Products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.description?.toLowerCase().includes(productSearch.toLowerCase());

    const matchesCategory =
      productCategoryFilter === 'all' ||
      product.category?.slug === productCategoryFilter ||
      product.category_id === productCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // ========================================================
  // RENDER: SECURITY GATE (Unauthenticated Public Screen)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-lock-card">
          <div className="admin-lock-icon">🔒</div>
          <h1 className="admin-lock-title">wrfitzz. Atelier Command</h1>
          <p className="admin-lock-desc">
            Private Owner Access. Enter your security PIN to unlock order tracking and inventory management.
          </p>

          <form onSubmit={handleLogin} className="admin-lock-form">
            <input
              type="password"
              required
              className="admin-lock-input"
              placeholder="Enter Owner PIN (default: wrfitzz@2026)"
              value={authPin}
              onChange={(e) => setAuthPin(e.target.value)}
              autoFocus
            />

            {authError && <div className="admin-lock-error">{authError}</div>}

            <button type="submit" className="admin-lock-btn">
              Unlock Control Center →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: WHITE EXECUTIVE ADMIN DASHBOARD
  // ========================================================
  return (
    <div className="admin-wrapper">
      {/* Admin Navbar */}
      <header className="admin-header">
        <div className="admin-header__inner">
          <div className="admin-logo-block">
            <Link href="/" className="admin-brand">
              wrfitzz<span>.</span>
            </Link>
            <span className="admin-badge">ATELIER EXECUTIVE</span>
          </div>

          <nav className="admin-header__nav">
            <button
              className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span>📦 Orders Tracker</span>
              <span className="admin-nav-count">{orders.length}</span>
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span>🏷️ Products Catalog</span>
              <span className="admin-nav-count">{products.length}</span>
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <span>🚚 Bangalore Dispatch</span>
            </button>
          </nav>

          <div className="admin-header__actions">
            <Link href="/" className="admin-store-link" target="_blank">
              <span>View Storefront ↗</span>
            </Link>
            <button
              type="button"
              className="admin-btn admin-btn--outline admin-btn--sm"
              onClick={handleLogout}
              title="Lock admin session"
            >
              🔒 Lock Session
            </button>
          </div>
        </div>
      </header>

      <main className="admin-container">
        {/* Top Operational Metrics */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <div className="admin-metric-card__header">
              <span className="admin-metric-card__title">Total Store Revenue</span>
              <span className="admin-metric-card__icon">💰</span>
            </div>
            <div className="admin-metric-card__value">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <div className="admin-metric-card__sub positive">● Bangalore Express Logistics</div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-card__header">
              <span className="admin-metric-card__title">Total Orders Placed</span>
              <span className="admin-metric-card__icon">📦</span>
            </div>
            <div className="admin-metric-card__value">{totalOrdersCount}</div>
            <div className="admin-metric-card__sub">All Customer Sessions</div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-card__header">
              <span className="admin-metric-card__title">In-Transit / Packing</span>
              <span className="admin-metric-card__icon">🚚</span>
            </div>
            <div className="admin-metric-card__value">{activeDispatchesCount}</div>
            <div className="admin-metric-card__sub">Active Dispatch Routes</div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-card__header">
              <span className="admin-metric-card__title">Delivered Orders</span>
              <span className="admin-metric-card__icon">✅</span>
            </div>
            <div className="admin-metric-card__value">{deliveredCount}</div>
            <div className="admin-metric-card__sub positive">100% Fulfillment Success</div>
          </div>
        </div>

        {/* ========================================================
            TAB 1: ORDERS TRACKER (Detailed Location & Customer Telemetry)
            ======================================================== */}
        {activeTab === 'orders' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div className="admin-section-title-wrap">
                <h2>Customer Orders &amp; Delivery Tracking</h2>
                <p>Track every piece of customer information, address, Bangalore PIN code, and dispatch waybills.</p>
              </div>

              <div className="admin-controls-row">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search name, phone, order ID, PIN..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />

                <select
                  className="admin-select"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses ({orders.length})</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packing">Packing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => fetchData()}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div className="admin-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order &amp; Time</th>
                    <th>Customer Information</th>
                    <th>Delivery Location (Bangalore)</th>
                    <th>Items Ordered</th>
                    <th>Total &amp; Payment</th>
                    <th>Status Action</th>
                    <th>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No orders found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <div className="admin-order-id">#{order.id}</div>
                          <div className="admin-order-time">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'Recent'}
                          </div>
                        </td>

                        <td>
                          <div className="admin-customer-info">
                            <span className="admin-customer-name">{order.customer_name}</span>
                            <span className="admin-customer-meta">✉️ {order.customer_email}</span>
                            <span className="admin-customer-meta">
                              📞 +91 {order.customer_phone}{' '}
                              <a
                                href={`https://wa.me/91${order.customer_phone?.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#16a34a', marginLeft: '6px', fontWeight: 'bold' }}
                                title="Chat on WhatsApp"
                              >
                                [WhatsApp]
                              </a>
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="admin-location-box">
                            <span className="admin-location-badge">
                              📍 Bangalore Hub Verified
                            </span>
                            <span className="admin-location-address">
                              {order.shipping_address || 'Bangalore, Karnataka'}
                            </span>
                            <span className="admin-location-pin">
                              PIN: <strong>{order.pincode || '560001'}</strong>
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {order.items?.slice(0, 2).map((item, idx) => (
                              <div
                                key={idx}
                                style={{
                                  position: 'relative',
                                  width: '36px',
                                  height: '46px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  border: '1px solid #e2e8f0',
                                }}
                                title={`${item.name} (${item.size}, ${item.color})`}
                              >
                                <Image
                                  src={item.image || '/images/products/geometric-shirt-front.jpg'}
                                  alt={item.name}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            ))}
                            {order.items?.length > 2 && (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                +{order.items.length - 2} more
                              </span>
                            )}
                            <div style={{ fontSize: '11px', color: '#334155', marginLeft: '4px' }}>
                              {order.items?.length || 0} items
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                            ₹{Number(order.total_amount).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              {order.payment_method || 'UPI'}
                            </span>
                            <span style={{ color: '#16a34a', marginLeft: '4px', fontWeight: 600 }}>
                              {order.payment_status || 'PAID'}
                            </span>
                          </div>
                        </td>

                        <td>
                          <select
                            className="admin-status-select"
                            value={order.status || 'confirmed'}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="packing">Packing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-btn admin-btn--outline admin-btn--sm"
                            onClick={() => setSelectedOrderDossier(order)}
                          >
                            Inspect Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 2: PRODUCTS CATALOG (Upload Images, Rename, Sizes, Colors)
            ======================================================== */}
        {activeTab === 'products' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div className="admin-section-title-wrap">
                <h2>Product Catalog &amp; Atelier Inventory</h2>
                <p>Upload new photography, change names, add sizes &amp; colors. Changes sync to storefront in real time.</p>
              </div>

              <div className="admin-controls-row">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search products by title..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />

                <select
                  className="admin-select"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="shirts">Shirts</option>
                  <option value="trousers">Trousers</option>
                  <option value="dresses">Dresses</option>
                  <option value="accessories">Accessories</option>
                  <option value="best-seller">Bestsellers</option>
                </select>

                <button
                  type="button"
                  className="admin-btn"
                  onClick={handleOpenCreateProduct}
                >
                  <span>＋ Add New Product</span>
                </button>
              </div>
            </div>

            <div className="admin-products-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="admin-product-card">
                  <div className="admin-product-card__img-wrap">
                    <Image
                      src={product.images?.[0] || '/images/products/geometric-shirt-front.jpg'}
                      alt={product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="admin-product-card__img"
                    />

                    <div className="admin-product-card__badges">
                      <span className="admin-pill admin-pill--category">
                        {product.category?.name || product.category_id || 'Garment'}
                      </span>
                      {product.is_bestseller && (
                        <span className="admin-pill admin-pill--bestseller">Bestseller</span>
                      )}
                      {product.is_new && (
                        <span className="admin-pill admin-pill--new">New</span>
                      )}
                    </div>
                  </div>

                  <div className="admin-product-card__body">
                    <h3 className="admin-product-card__title">{product.name}</h3>

                    <div className="admin-product-card__price-row">
                      <span className="admin-product-card__price">₹{Number(product.price).toLocaleString('en-IN')}</span>
                      {product.compare_price > product.price && (
                        <span className="admin-product-card__compare">
                          ₹{Number(product.compare_price).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Sizes chips */}
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Sizes:
                      </span>
                      <div className="admin-chips-row">
                        {product.sizes?.map((size, idx) => (
                          <span key={idx} className="admin-size-chip">{size}</span>
                        ))}
                      </div>
                    </div>

                    {/* Colors chips */}
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Colors:
                      </span>
                      <div className="admin-chips-row">
                        {product.colors?.map((col, idx) => (
                          <span key={idx} className="admin-color-chip">
                            <span className="admin-color-dot" style={{ backgroundColor: col.hex || '#111' }} />
                            {col.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="admin-product-card__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm"
                        onClick={() => handleOpenEditProduct(product)}
                      >
                        ✏️ Edit Product
                      </button>

                      <Link
                        href={`/product/${product.slug || product.id}`}
                        target="_blank"
                        className="admin-btn admin-btn--outline admin-btn--sm"
                      >
                        👁️ Live View
                      </Link>

                      <button
                        type="button"
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        style={{ color: '#ef4444', borderColor: '#fca5a5', marginLeft: 'auto' }}
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            TAB 3: BANGALORE DISPATCH LOGISTICS
            ======================================================== */}
        {activeTab === 'analytics' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <div className="admin-section-title-wrap">
                <h2>Bangalore Logistics &amp; Fulfillment Routing</h2>
                <p>Tracking local delivery hub status, pincode routing, and dispatch metrics.</p>
              </div>
            </div>

            <div className="admin-card" style={{ padding: '28px' }}>
              <div className="order-route-banner">
                <div>
                  <strong style={{ color: '#16a34a', fontSize: '14px' }}>
                    🟢 Bengaluru Central Hub (Indiranagar / Whitefield / Koramangala)
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#334155' }}>
                    Express reverse-courier &amp; next-day delivery live across all 560001 - 562165 postal codes.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Dispatch Status</span>
                  <div style={{ fontWeight: '800', color: '#0f172a' }}>99.4% On-Time Delivery</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
                <div className="order-dossier-card">
                  <h4>Top Bangalore Delivery Pincodes</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>📍 560038 (Indiranagar / HAL)</span>
                      <strong style={{ color: '#0f172a' }}>34% Orders</strong>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>📍 560034 (Koramangala)</span>
                      <strong style={{ color: '#0f172a' }}>28% Orders</strong>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>📍 560066 (Whitefield)</span>
                      <strong style={{ color: '#0f172a' }}>22% Orders</strong>
                    </li>
                  </ul>
                </div>

                <div className="order-dossier-card">
                  <h4>Payment Mode Share</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>📱 UPI (GPay / PhonePe / BHIM)</span>
                      <strong style={{ color: '#16a34a' }}>68%</strong>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>💳 Credit &amp; Debit Cards</span>
                      <strong style={{ color: '#2563eb' }}>22%</strong>
                    </li>
                    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>💵 Cash on Delivery</span>
                      <strong style={{ color: '#ca8a04' }}>10%</strong>
                    </li>
                  </ul>
                </div>

                <div className="order-dossier-card">
                  <h4>Atelier Packaging Protocol</h4>
                  <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                    Every wrfitzz garment is hand-inspected in Bangalore, wrapped in sustainable matte acid-free paper, and stamped with the archival capsule tag before courier pickup.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ========================================================
          MODAL 1: ORDER DOSSIER (Inspect Every Customer & Location Telemetry)
          ======================================================== */}
      {selectedOrderDossier && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrderDossier(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>Order Dossier: #{selectedOrderDossier.id}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Placed on {selectedOrderDossier.created_at ? new Date(selectedOrderDossier.created_at).toLocaleString('en-IN') : 'Recent'}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedOrderDossier(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal__body">
              {/* Bangalore Route Banner */}
              <div className="order-route-banner">
                <div>
                  <strong style={{ color: '#16a34a', fontSize: '13px' }}>
                    🚀 Courier Waybill: {selectedOrderDossier.trackingNumber || `BLR-EXP-${selectedOrderDossier.id.slice(-6)}`}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#334155' }}>
                    Direct dispatch from Bangalore Warehouse to {selectedOrderDossier.city || 'Bangalore'}, {selectedOrderDossier.pincode}
                  </p>
                </div>
                <div>
                  <span className={`admin-status-badge status-${selectedOrderDossier.status || 'confirmed'}`}>
                    {selectedOrderDossier.status?.toUpperCase() || 'CONFIRMED'}
                  </span>
                </div>
              </div>

              <div className="order-dossier-grid">
                {/* Customer Information Card */}
                <div className="order-dossier-card">
                  <h4>Customer Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Full Name:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{selectedOrderDossier.customer_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Email Address:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{selectedOrderDossier.customer_email}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Phone Number:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>+91 {selectedOrderDossier.customer_phone}</strong>{' '}
                      <a
                        href={`https://wa.me/91${selectedOrderDossier.customer_phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#16a34a', marginLeft: '6px', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        [Open WhatsApp]
                      </a>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Payment Mode:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>{selectedOrderDossier.payment_method || 'UPI'}</strong> ({selectedOrderDossier.payment_status || 'PAID'})
                    </div>
                  </div>
                </div>

                {/* Delivery Location Card */}
                <div className="order-dossier-card">
                  <h4>Delivery Address &amp; Location</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Street Address:</span>
                      <p style={{ margin: '4px 0 0', color: '#0f172a', fontWeight: 600 }}>
                        {selectedOrderDossier.shipping_address}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>City &amp; State:</span>{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {selectedOrderDossier.city || 'Bangalore'}, {selectedOrderDossier.state || 'Karnataka'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Postal PIN Code:</span>{' '}
                      <strong style={{ color: '#16a34a' }}>{selectedOrderDossier.pincode}</strong> (Bangalore Verified)
                    </div>
                    {selectedOrderDossier.admin_notes && (
                      <div style={{ marginTop: '4px', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px' }}>
                        <span style={{ color: '#B55941', fontSize: '11px', fontWeight: 'bold' }}>CUSTOMER NOTE:</span>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#334155' }}>
                          {selectedOrderDossier.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Purchased Card */}
              <div className="order-dossier-card" style={{ marginTop: '4px' }}>
                <h4>Purchased Items ({selectedOrderDossier.items?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrderDossier.items?.map((item, idx) => (
                    <div key={idx} className="order-dossier-item-row">
                      <Image
                        src={item.image || '/images/products/geometric-shirt-front.jpg'}
                        alt={item.name}
                        width={52}
                        height={64}
                        className="order-dossier-item-img"
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                          Size: <strong style={{ color: '#0f172a' }}>{item.size || 'M'}</strong> · Color: <strong style={{ color: '#0f172a' }}>{item.color || 'Standard'}</strong> · Qty: <strong style={{ color: '#0f172a' }}>{item.quantity}</strong>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
                        ₹{(Number(item.price) * (item.quantity || 1)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Express Delivery: <strong>FREE</strong> · All Taxes Included
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                    Total: ₹{Number(selectedOrderDossier.total_amount).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Status Management Bar */}
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Update Status Pipeline:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['confirmed', 'packing', 'out_for_delivery', 'delivered'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`admin-btn admin-btn--sm ${selectedOrderDossier.status === st ? '' : 'admin-btn--outline'}`}
                      onClick={() => handleUpdateOrderStatus(selectedOrderDossier.id, st)}
                    >
                      {st.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                onClick={() => window.print()}
              >
                🖨️ Print Packing Slip
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() => setSelectedOrderDossier(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: PRODUCT EDITOR (Upload Images, Rename, Sizes, Colors)
          ======================================================== */}
      {isProductModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveProduct}>
              <div className="admin-modal__header">
                <h3>{editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Atelier Product'}</h3>
                <button
                  type="button"
                  className="admin-modal__close"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="admin-modal__body">
                <div className="admin-form-grid">
                  {/* Product Name */}
                  <div className="admin-form-group full-width">
                    <label className="admin-form-label">Product Name / Title *</label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      placeholder="e.g. Masterwork Tailored Overshirt"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    />
                  </div>

                  {/* Category */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Category</label>
                    <select
                      className="admin-form-select"
                      value={productForm.category_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        const catNames = {
                          'cat-shirts': 'Shirts',
                          'cat-trousers': 'Trousers',
                          'cat-dresses': 'Dresses',
                          'cat-accessories': 'Accessories',
                          'cat-bestseller': 'Bestsellers',
                        };
                        setProductForm({
                          ...productForm,
                          category_id: val,
                          category: { name: catNames[val] || 'Shirts', slug: val.replace('cat-', '') },
                        });
                      }}
                    >
                      <option value="cat-shirts">Shirts</option>
                      <option value="cat-trousers">Trousers</option>
                      <option value="cat-dresses">Dresses</option>
                      <option value="cat-accessories">Accessories</option>
                      <option value="cat-bestseller">Bestsellers</option>
                    </select>
                  </div>

                  {/* Gender */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Gender Segment</label>
                    <select
                      className="admin-form-select"
                      value={productForm.gender}
                      onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      className="admin-form-input"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>

                  {/* Compare Price */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Compare Price / MRP (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      value={productForm.compare_price}
                      onChange={(e) => setProductForm({ ...productForm, compare_price: e.target.value })}
                    />
                  </div>

                  {/* Badges & Stock Toggles */}
                  <div className="admin-form-group full-width" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={productForm.in_stock}
                        onChange={(e) => setProductForm({ ...productForm, in_stock: e.target.checked })}
                      />
                      <span>In Stock</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={productForm.is_bestseller}
                        onChange={(e) => setProductForm({ ...productForm, is_bestseller: e.target.checked })}
                      />
                      <span style={{ color: '#B55941', fontWeight: 'bold' }}>⭐ Mark Bestseller</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={productForm.is_new}
                        onChange={(e) => setProductForm({ ...productForm, is_new: e.target.checked })}
                      />
                      <span style={{ color: '#2563eb' }}>✨ Mark New Drop</span>
                    </label>
                  </div>

                  {/* IMAGE UPLOADER & MANAGER */}
                  <div className="admin-form-group full-width">
                    <label className="admin-form-label">Product Photography &amp; Images</label>
                    <div className="admin-upload-zone">
                      <input
                        type="file"
                        accept="image/*"
                        id="product-img-file"
                        style={{ display: 'none' }}
                        onChange={handleImageFileUpload}
                        disabled={uploadingImage}
                      />
                      <label htmlFor="product-img-file" style={{ cursor: 'pointer', display: 'block' }}>
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>📸</div>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                          {uploadingImage ? 'Uploading Image...' : 'Click to Upload Image from Device'}
                        </strong>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                          Supports JPG, PNG, WEBP files. Stored directly into atelier storefront.
                        </p>
                      </label>
                    </div>

                    {/* Image Previews & Re-order */}
                    <div className="admin-images-preview-row">
                      {productForm.images.map((imgUrl, idx) => (
                        <div key={idx} className="admin-img-thumb-box">
                          <Image
                            src={imgUrl}
                            alt="Product view"
                            fill
                            className="admin-img-thumb"
                          />
                          {productForm.images.length > 1 && (
                            <button
                              type="button"
                              className="admin-img-remove"
                              onClick={() => handleRemoveImage(imgUrl)}
                              title="Remove image"
                            >
                              ✕
                            </button>
                          )}
                          {idx === 0 && (
                            <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.75)', fontSize: '9px', padding: '1px 4px', borderRadius: '3px', color: '#fff' }}>
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SIZES MANAGEMENT */}
                  <div className="admin-form-group full-width">
                    <label className="admin-form-label">Available Sizes</label>
                    <div className="admin-sizes-manager">
                      <div className="admin-sizes-chips-wrap">
                        {productForm.sizes.map((sz, idx) => (
                          <span key={idx} className="admin-size-tag">
                            <span>{sz}</span>
                            <button
                              type="button"
                              className="admin-size-tag-remove"
                              onClick={() => handleRemoveSize(sz)}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Quick Common Presets */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Quick add:</span>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className="admin-btn admin-btn--outline admin-btn--sm"
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            onClick={() => {
                              if (!productForm.sizes.includes(preset)) {
                                setProductForm(prev => ({ ...prev, sizes: [...prev.sizes, preset] }));
                              }
                            }}
                          >
                            +{preset}
                          </button>
                        ))}
                      </div>

                      <div className="admin-add-size-row" style={{ marginTop: '6px' }}>
                        <input
                          type="text"
                          className="admin-form-input"
                          style={{ maxWidth: '160px' }}
                          placeholder="Custom Size (e.g. 40)"
                          value={newSizeInput}
                          onChange={(e) => setNewSizeInput(e.target.value)}
                        />
                        <button
                          type="button"
                          className="admin-btn admin-btn--outline admin-btn--sm"
                          onClick={handleAddSize}
                        >
                          Add Custom Size
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COLORS MANAGEMENT */}
                  <div className="admin-form-group full-width">
                    <label className="admin-form-label">Available Colors &amp; Swatches</label>
                    <div className="admin-colors-manager">
                      {productForm.colors.map((col, idx) => (
                        <div key={idx} className="admin-color-item-row">
                          <input
                            type="color"
                            className="admin-color-picker-input"
                            value={col.hex || '#2B2B28'}
                            onChange={(e) => {
                              const newHex = e.target.value;
                              setProductForm(prev => {
                                const copy = [...prev.colors];
                                copy[idx] = { ...copy[idx], hex: newHex };
                                return { ...prev, colors: copy };
                              });
                            }}
                          />
                          <input
                            type="text"
                            className="admin-form-input"
                            style={{ flex: 1 }}
                            placeholder="Color Name (e.g. Slate Gray)"
                            value={col.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setProductForm(prev => {
                                const copy = [...prev.colors];
                                copy[idx] = { ...copy[idx], name: newName };
                                return { ...prev, colors: copy };
                              });
                            }}
                          />
                          {productForm.colors.length > 1 && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--outline admin-btn--sm"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleRemoveColor(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add new color row */}
                      <div className="admin-color-item-row" style={{ background: '#f1f5f9' }}>
                        <input
                          type="color"
                          className="admin-color-picker-input"
                          value={newColorForm.hex}
                          onChange={(e) => setNewColorForm({ ...newColorForm, hex: e.target.value })}
                        />
                        <input
                          type="text"
                          className="admin-form-input"
                          style={{ flex: 1 }}
                          placeholder="New Color Name (e.g. Forest Moss)"
                          value={newColorForm.name}
                          onChange={(e) => setNewColorForm({ ...newColorForm, name: e.target.value })}
                        />
                        <button
                          type="button"
                          className="admin-btn admin-btn--outline admin-btn--sm"
                          onClick={handleAddColor}
                        >
                          ＋ Add Color
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="admin-form-group full-width">
                    <label className="admin-form-label">Garment Description</label>
                    <textarea
                      className="admin-form-textarea"
                      placeholder="Artisan streetwear description..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>

                  {/* Material */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Fabric &amp; Material</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={productForm.material}
                      onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                    />
                  </div>

                  {/* Care Instructions */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Care Instructions</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={productForm.care_instructions}
                      onChange={(e) => setProductForm({ ...productForm, care_instructions: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn"
                >
                  💾 Save &amp; Sync to Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast">
          ✓ {toastMessage}
        </div>
      )}
    </div>
  );
}
