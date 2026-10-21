'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminRequest } from './adminApi';
import OrdersPanel from './OrdersPanel';
import ProductsPanel from './ProductsPanel';
import OverviewPanel from './OverviewPanel';

const TABS = [
  ['orders', 'Orders'],
  ['products', 'Products'],
  ['overview', 'Overview'],
];

function AdminLogin({ setupProblem, onSignedIn }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Enter the admin password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await adminRequest('/api/admin/auth', { method: 'POST', body: { password } });
      setPassword('');
      onSignedIn(data.storage);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="adm-login" id="main">
      <form className="adm-login__caja qs-form" onSubmit={submit} noValidate>
        <p className="qs-eyebrow">wrfitzz</p>
        <h1 className="qs-h1">Admin</h1>
        {setupProblem ? (
          <div className="qs-alert" role="alert"><p>{setupProblem}</p></div>
        ) : (
          <>
            {error && <div className="qs-alert" role="alert"><p>{error}</p></div>}
            <div className="qs-field">
              <label className="qs-label" htmlFor="adm-pass">Password</label>
              <input
                id="adm-pass"
                className="qs-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? 'true' : undefined}
              />
            </div>
            <button type="submit" className="boton boton--lleno boton--ancho" disabled={busy} aria-busy={busy || undefined}>
              Sign in
            </button>
          </>
        )}
        <Link href="/" className="boton boton--texto">Back to the store</Link>
      </form>
    </main>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState(null); // { authorized, setupProblem, storage }
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);

  const signedOut = useCallback(() => setSession((s) => ({ ...(s || {}), authorized: false })), []);

  // Runs a request; a 401 means the session ended, so show the sign-in again.
  const call = useCallback(async (url, options) => {
    try {
      return await adminRequest(url, options);
    } catch (err) {
      if (err.status === 401) signedOut();
      throw err;
    }
  }, [signedOut]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [o, p, c] = await Promise.all([
        call('/api/orders'),
        call('/api/products?all=1'),
        call('/api/categories'),
      ]);
      setOrders(o);
      setProducts(p);
      setCategories(c.filter((cat) => cat.slug !== 'best-seller'));
    } catch (err) {
      if (err.status !== 401) setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    adminRequest('/api/admin/auth')
      .then(setSession)
      .catch(() => setSession({ authorized: false }));
  }, []);

  useEffect(() => {
    if (session?.authorized) loadAll();
  }, [session?.authorized, loadAll]);

  const signOut = async () => {
    await adminRequest('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    signedOut();
  };

  if (!session) {
    return <main className="adm-login" id="main" aria-busy="true"><p className="qs-sub">Loading…</p></main>;
  }
  if (!session.authorized) {
    return (
      <AdminLogin
        setupProblem={session.setupProblem}
        onSignedIn={(storage) => setSession({ authorized: true, storage })}
      />
    );
  }

  const replaceOrder = (order) => setOrders((list) => list.map((o) => (o.id === order.id ? order : o)));
  const replaceProduct = (product) =>
    setProducts((list) => {
      const exists = list.some((p) => p.id === product.id);
      const withCategory = {
        ...product,
        category: categories.find((c) => c.id === product.category_id) || product.category || null,
      };
      return exists ? list.map((p) => (p.id === product.id ? { ...p, ...withCategory } : p)) : [withCategory, ...list];
    });
  const removeProduct = (id) => setProducts((list) => list.filter((p) => p.id !== id));

  return (
    <div className="adm">
      <header className="adm-cab">
        <div className="adm-cab__marca">
          <span className="adm-cab__logo">wrfitzz</span>
          <span className="adm-cab__tag">Admin</span>
        </div>
        <nav className="adm-tabs" aria-label="Admin sections">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="adm-tab"
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => setTab(key)}
            >
              {label}
              {key === 'orders' && orders.length > 0 && <span className="adm-tab__n">{orders.length}</span>}
            </button>
          ))}
        </nav>
        <div className="adm-cab__acciones">
          <button type="button" className="boton boton--texto" onClick={loadAll} disabled={loading} aria-busy={loading || undefined}>
            Refresh
          </button>
          <Link href="/" className="boton boton--texto" target="_blank" rel="noreferrer">
            View store<span className="qs-sr"> (opens in a new tab)</span>
          </Link>
          <button type="button" className="boton" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {session.storage !== 'database' && (
        <div className="qs-alert qs-alert--info adm-aviso" role="status">
          <p>
            <b>Database not connected.</b> Saving only works when the store runs on your own computer; on
            the live site changes will fail. Run <code>supabase/setup.sql</code> in Supabase and add{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel, then redeploy.
          </p>
        </div>
      )}
      {loadError && (
        <div className="qs-alert adm-aviso" role="alert"><p>{loadError}</p></div>
      )}

      <main className="adm-main" id="main">
        {tab === 'orders' && <OrdersPanel orders={orders} call={call} onOrderSaved={replaceOrder} loading={loading} />}
        {tab === 'products' && (
          <ProductsPanel
            products={products}
            categories={categories}
            call={call}
            onProductSaved={replaceProduct}
            onProductDeleted={removeProduct}
          />
        )}
        {tab === 'overview' && <OverviewPanel orders={orders} products={products} onOpenTab={setTab} />}
      </main>
    </div>
  );
}
