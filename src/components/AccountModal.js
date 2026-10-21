'use client';
import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import useDialog from '@/hooks/useDialog';
import { FREE_DELIVERY_OVER, PREPAID_DISCOUNT, formatINR } from '@/lib/pricing';
import { cleanPincode, isBangalorePincode } from '@/lib/delivery';

function Field({ id, label, hint, children }) {
  return (
    <div className="qs-field">
      <label className="qs-label" htmlFor={id}>{label}{hint && <i> · {hint}</i>}</label>
      {children}
    </div>
  );
}

function Message({ error, success }) {
  if (error) return <div className="qs-alert" role="alert"><p>{error}</p></div>;
  if (success) return <div className="qs-alert qs-alert--info" role="status"><p>{success}</p></div>;
  return null;
}

export default function AccountModal({ isOpen, onClose }) {
  const uid = useId();
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    logout,
    updateProfile,
  } = useAuth();
  const panelRef = useDialog(isOpen, onClose);

  // Auth modes: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile views for signed-in users: 'overview' | 'orders' | 'address'
  const [profileTab, setProfileTab] = useState('overview');
  const [savedAddress, setSavedAddress] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [orders, setOrders] = useState([]);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Load orders & address from localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const addr = localStorage.getItem('wrfitzz_saved_address') || localStorage.getItem('wrfitzz-saved-address');
      setSavedAddress(addr ? JSON.parse(addr) : null);
      const savedOrders = localStorage.getItem('wrfitzz_orders');
      setOrders(savedOrders ? JSON.parse(savedOrders) : []);
    } catch { /* ignore */ }
    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setEmailInput(user.email || '');
    }
  }, [user]);

  // The payment confirmation screen asks for the orders view.
  useEffect(() => {
    const handleOpenOrders = () => setProfileTab('orders');
    window.addEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
    return () => window.removeEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
  }, []);

  if (!isOpen) return null;

  const switchMode = (mode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const run = async (fn, fallback) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => run(() => signInWithGoogle(), 'We could not sign you in with Google.');

  const handleEmailSignIn = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Enter your email and password.');
      return;
    }
    run(() => signInWithEmail(email, password), 'We could not sign you in. Check your email and password.');
  };

  const handleEmailSignUp = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Enter an email and a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Use a password with at least 6 characters.');
      return;
    }
    run(() => signUpWithEmail(email, password, name.trim()), 'We could not create your account.');
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Enter the email you signed up with.');
      return;
    }
    run(async () => {
      await sendPasswordReset(email);
      setSuccessMsg(`We sent a reset link to ${email}. Check your inbox.`);
    }, 'We could not send the reset email.');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    run(async () => {
      await updateProfile({ name: nameInput.trim(), email: emailInput.trim() });
      setEditProfileOpen(false);
    }, 'We could not save your details.');
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pincode = cleanPincode(fd.get('pincode'));
    if (!isBangalorePincode(pincode)) {
      setAddressError('We deliver inside Bangalore only for now. Enter a Bangalore PIN code, such as 560038.');
      return;
    }
    const newAddr = {
      address: String(fd.get('address') || '').trim(),
      city: 'Bangalore',
      state: 'Karnataka',
      pincode,
      phone: String(fd.get('phone') || user?.phone || ''),
      name: user?.name || 'Customer',
    };
    try {
      localStorage.setItem('wrfitzz_saved_address', JSON.stringify(newAddr));
    } catch { /* ignore */ }
    setSavedAddress(newAddr);
    setEditingAddress(false);
    setAddressError('');
  };

  const pct = Math.round(PREPAID_DISCOUNT * 100);

  // A plain function (not a component) so the panel is not remounted on every render.
  const shell = (title, body) => (
    <>
      <div className="qs-velo" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="qs-drawer qs-drawer--ancho"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-t`}
        tabIndex={-1}
      >
        <div className="qs-drawer__cab">
          <h2 id={`${uid}-t`}>{title}</h2>
          <button className="qs-cerrar" type="button" aria-label="Close account" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="qs-drawer__cuerpo">{body}</div>
      </div>
    </>
  );

  // ---------- Signed in ----------
  if (user) {
    return shell('Your account', (
      <>
        <div className="qs-cuenta-cab">
          <p className="qs-eyebrow">{user.isAdmin ? 'Store admin' : 'Member'}</p>
          <p className="qs-cuenta-nombre">{user.name || 'wrfitzz member'}</p>
          <p className="qs-hint">{user.email || user.phone}{user.joinedDate ? ` · joined ${user.joinedDate}` : ''}</p>
        </div>

        {user.isAdmin && (
          <div className="qs-alert qs-alert--info">
            <p>You have access to orders, products and roles.</p>
            <Link href="/admin" className="qs-quitar" onClick={onClose}>Open admin</Link>
          </div>
        )}

        <div className="qs-segmentos" role="group" aria-label="Account sections">
          {[
            ['overview', 'Details'],
            ['orders', `Orders (${orders.length})`],
            ['address', 'Address'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="qs-segmento"
              aria-pressed={profileTab === key}
              onClick={() => setProfileTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {profileTab === 'overview' && (
          <div className="qs-form">
            <Message error={errorMsg} />
            {!editProfileOpen ? (
              <>
                <dl className="qs-datos">
                  <div><dt>Name</dt><dd>{user.name || 'Not added yet'}</dd></div>
                  <div><dt>Email</dt><dd>{user.email || 'Not added yet'}</dd></div>
                  {user.phone && <div><dt>Phone</dt><dd>{user.phone}</dd></div>}
                </dl>
                <button type="button" className="boton" onClick={() => setEditProfileOpen(true)}>Edit details</button>
              </>
            ) : (
              <form onSubmit={handleSaveProfile} className="qs-form">
                <Field id={`${uid}-pn`} label="Full name">
                  <input id={`${uid}-pn`} className="qs-input" type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} autoComplete="name" required />
                </Field>
                <Field id={`${uid}-pe`} label="Email">
                  <input id={`${uid}-pe`} className="qs-input" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} autoComplete="email" />
                </Field>
                <div className="qs-botones">
                  <button type="submit" className="boton boton--lleno" disabled={loading} aria-busy={loading || undefined}>Save</button>
                  <button type="button" className="boton" onClick={() => setEditProfileOpen(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="qs-caja">
              <h3 className="qs-caja__titulo">What you get</h3>
              <ul className="qs-rasgos">
                <li>Free delivery in Bangalore over {formatINR(FREE_DELIVERY_OVER)}</li>
                <li>{pct}% off when you pay online</li>
                <li>15-day size and style exchanges</li>
                <li>Early access to new drops</li>
              </ul>
            </div>

            <button type="button" className="boton boton--texto" onClick={logout}>Sign out</button>
          </div>
        )}

        {profileTab === 'orders' && (
          orders.length === 0 ? (
            <div className="qs-empty">
              <h2>No orders yet</h2>
              <p>Your orders on this device will show up here.</p>
              <Link href="/shop" className="boton boton--lleno" onClick={onClose}>Shop all pieces</Link>
            </div>
          ) : (
            <ul className="qs-pedidos">
              {orders.map((order, idx) => (
                <li key={order.id || idx} className="qs-caja">
                  <div className="qs-fila">
                    <b>Order #{String(order.id || `WRF-${idx + 101}`).slice(-8).toUpperCase()}</b>
                    <span className="qs-tag qs-tag--tinta">{order.payment_method === 'COD' ? 'Cash on delivery' : order.status || 'Confirmed'}</span>
                  </div>
                  {(order.createdAt || order.date) && (
                    <p className="qs-hint">
                      {new Date(order.createdAt || order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <ul className="qs-rasgos">
                    {(order.items || []).map((item, i) => (
                      <li key={i}>{item.name} × {item.quantity} · {formatINR((item.price || 0) * (item.quantity || 1))}</li>
                    ))}
                  </ul>
                  <div className="qs-fila">
                    <span>{order.payment_method === 'COD' ? 'Due on delivery' : 'Paid'}</span>
                    <b>{formatINR(order.total_amount ?? order.total ?? order.amount ?? 0)}</b>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {profileTab === 'address' && (
          savedAddress && !editingAddress ? (
            <div className="qs-caja">
              <div className="qs-fila">
                <h3 className="qs-caja__titulo">Delivery address</h3>
                <button type="button" className="qs-quitar" onClick={() => setEditingAddress(true)}>Change</button>
              </div>
              <p className="qs-sub">
                {savedAddress.name || user.name}<br />
                {savedAddress.address}<br />
                {savedAddress.city}, {savedAddress.state} {savedAddress.pincode}<br />
                {savedAddress.phone && `+91 ${savedAddress.phone}`}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveAddress} className="qs-form" noValidate>
              {addressError && <Message error={addressError} />}
              <Field id={`${uid}-ad`} label="Street address, flat or house number">
                <input id={`${uid}-ad`} name="address" className="qs-input" type="text" required autoComplete="street-address" defaultValue={savedAddress?.address || ''} />
              </Field>
              <div className="qs-grid">
                <Field id={`${uid}-ap`} label="PIN code" hint="Bangalore">
                  <input
                    id={`${uid}-ap`}
                    name="pincode"
                    className="qs-input"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="560038"
                    autoComplete="postal-code"
                    defaultValue={savedAddress?.pincode || ''}
                    aria-invalid={addressError ? 'true' : undefined}
                  />
                </Field>
                <Field id={`${uid}-af`} label="Mobile number">
                  <input id={`${uid}-af`} name="phone" className="qs-input" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" defaultValue={savedAddress?.phone || user.phone || ''} />
                </Field>
              </div>
              <div className="qs-botones">
                <button type="submit" className="boton boton--lleno">Save address</button>
                {savedAddress && (
                  <button type="button" className="boton" onClick={() => { setEditingAddress(false); setAddressError(''); }}>Cancel</button>
                )}
              </div>
            </form>
          )
        )}
      </>
    ));
  }

  // ---------- Signed out ----------
  if (authMode === 'forgot') {
    return shell('Reset password', (
      <form className="qs-form" onSubmit={handlePasswordReset} noValidate>
        <p className="qs-sub">Enter your account email and we will send you a link to set a new password.</p>
        <Message error={errorMsg} success={successMsg} />
        <Field id={`${uid}-fe`} label="Email">
          <input id={`${uid}-fe`} className="qs-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button type="submit" className="boton boton--lleno boton--ancho" disabled={loading} aria-busy={loading || undefined}>Send reset link</button>
        <button type="button" className="boton boton--texto" onClick={() => switchMode('login')}>Back to sign in</button>
      </form>
    ));
  }

  return shell(authMode === 'signup' ? 'Create an account' : 'Sign in', (
    <>
      <p className="qs-sub">Track orders, save your address and check out faster.</p>

      <button type="button" className="boton boton--ancho qs-google" onClick={handleGoogleSignIn} disabled={loading} aria-busy={loading || undefined}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>

      <p className="qs-separador"><span>or with email</span></p>

      <div className="qs-segmentos" role="group" aria-label="Account options">
        <button type="button" className="qs-segmento" aria-pressed={authMode === 'login'} onClick={() => switchMode('login')}>Sign in</button>
        <button type="button" className="qs-segmento" aria-pressed={authMode === 'signup'} onClick={() => switchMode('signup')}>Create account</button>
      </div>

      <Message error={errorMsg} />

      {authMode === 'login' ? (
        <form className="qs-form" onSubmit={handleEmailSignIn} noValidate>
          <Field id={`${uid}-le`} label="Email">
            <input id={`${uid}-le`} className="qs-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id={`${uid}-lp`} label="Password">
            <input id={`${uid}-lp`} className="qs-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button type="button" className="qs-quitar" onClick={() => switchMode('forgot')}>Forgot your password?</button>
          <button type="submit" className="boton boton--lleno boton--ancho" disabled={loading} aria-busy={loading || undefined}>Sign in</button>
        </form>
      ) : (
        <form className="qs-form" onSubmit={handleEmailSignUp} noValidate>
          <Field id={`${uid}-sn`} label="Full name" hint="optional">
            <input id={`${uid}-sn`} className="qs-input" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id={`${uid}-se`} label="Email">
            <input id={`${uid}-se`} className="qs-input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id={`${uid}-sp`} label="Password" hint="at least 6 characters">
            <input id={`${uid}-sp`} className="qs-input" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button type="submit" className="boton boton--lleno boton--ancho" disabled={loading} aria-busy={loading || undefined}>Create account</button>
        </form>
      )}
    </>
  ));
}
