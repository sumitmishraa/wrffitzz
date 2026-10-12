'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AccountModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [profileTab, setProfileTab] = useState('overview'); // 'overview', 'orders', 'address'
  const [savedAddress, setSavedAddress] = useState(null);
  const [orders, setOrders] = useState([]);

  // Load user and saved data
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('wrfitzz-user');
      if (savedUser) {
        let u = JSON.parse(savedUser);
        if (!u.name || u.name.includes('@') || u.name === 'sumitmishraa.business') {
          u.name = 'Sumit Mishra';
          localStorage.setItem('wrfitzz-user', JSON.stringify(u));
        }
        setUser(u);
      }

      const addr = localStorage.getItem('wrfitzz_saved_address') || localStorage.getItem('wrfitzz-saved-address');
      if (addr) setSavedAddress(JSON.parse(addr));

      const savedOrders = localStorage.getItem('wrfitzz_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch (e) { /* ignore */ }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenOrders = () => {
      setProfileTab('orders');
    };
    window.addEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
    return () => window.removeEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setSubmitted(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalName = 'Sumit Mishra';
    if (tab === 'register') {
      finalName = name.trim() || 'Sumit Mishra';
    } else {
      finalName = (user?.name && !user.name.includes('@') && user.name !== 'sumitmishraa.business')
        ? user.name
        : (name.trim() || 'Sumit Mishra');
    }
    const userData = {
      name: finalName,
      email: email.trim(),
      phone: '+91 98765 43210',
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    };
    localStorage.setItem('wrfitzz-user', JSON.stringify(userData));
    setUser(userData);
    window.dispatchEvent(new Event('wrfitzz_user_updated'));
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('wrfitzz-user');
    setUser(null);
    setTab('login');
    setEmail('');
    setPassword('');
    setName('');
    setProfileTab('overview');
    window.dispatchEvent(new Event('wrfitzz_user_updated'));
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newAddr = {
      address: fd.get('address') || fd.get('line1'),
      city: fd.get('city') || 'Bangalore',
      state: fd.get('state') || 'Karnataka',
      pincode: fd.get('pincode'),
      phone: fd.get('phone'),
      name: user?.name || 'Customer',
    };
    localStorage.setItem('wrfitzz_saved_address', JSON.stringify(newAddr));
    setSavedAddress(newAddr);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // If user is logged in, show their Profile Dashboard
  if (user) {
    return (
      <div className="account-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="account-modal__container account-modal__container--profile" onClick={e => e.stopPropagation()}>
          <button className="account-modal__close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>

          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-header__avatar">{initials}</div>
            <div className="profile-header__info">
              <h3 className="profile-header__name">{user.name}</h3>
              <p className="profile-header__email">{user.email}</p>
              <div className="profile-header__meta">
                <span className="profile-header__badge">wrfitzz Member</span>
                <span className="profile-header__since">Joined {user.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Profile Navigation Tabs */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${profileTab === 'overview' ? 'profile-tab--active' : ''}`}
              onClick={() => setProfileTab('overview')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              My Profile
            </button>
            <button
              className={`profile-tab ${profileTab === 'orders' ? 'profile-tab--active' : ''}`}
              onClick={() => setProfileTab('orders')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Track Orders ({orders.length})
            </button>
            <button
              className={`profile-tab ${profileTab === 'address' ? 'profile-tab--active' : ''}`}
              onClick={() => setProfileTab('address')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Saved Address
            </button>
          </div>

          {/* Profile Content */}
          <div className="profile-content">
            {/* OVERVIEW TAB */}
            {profileTab === 'overview' && (
              <div className="profile-overview">
                <div className="profile-card">
                  <h4 className="profile-card__title">Personal Details</h4>
                  <div className="profile-card__row">
                    <span className="profile-card__label">Full Name</span>
                    <strong className="profile-card__value">{user.name}</strong>
                  </div>
                  <div className="profile-card__row">
                    <span className="profile-card__label">Email</span>
                    <strong className="profile-card__value">{user.email}</strong>
                  </div>
                  <div className="profile-card__row">
                    <span className="profile-card__label">City Access</span>
                    <span className="profile-card__badge-city">📍 Bangalore Hub Verified</span>
                  </div>
                </div>

                <div className="profile-card profile-card--perks">
                  <h4 className="profile-card__title">Member Privileges</h4>
                  <div className="profile-perks-list">
                    <div className="profile-perk-item">
                      <span>⚡</span>
                      <div>
                        <strong>Free Bangalore Delivery</strong>
                        <p>Enjoy free express shipping on all orders above ₹2,999</p>
                      </div>
                    </div>
                    <div className="profile-perk-item">
                      <span>🎟️</span>
                      <div>
                        <strong>10% Off Prepaid Orders</strong>
                        <p>Use code PREPAID10 at checkout</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="button" className="profile-logout-btn" onClick={handleLogout}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                  Sign Out from wrfitzz
                </button>
              </div>
            )}

            {/* TRACK ORDERS TAB */}
            {profileTab === 'orders' && (
              <div className="profile-orders">
                {orders.length === 0 ? (
                  <div className="profile-orders__empty">
                    <div className="empty-order-icon">📦</div>
                    <h4>No active orders</h4>
                    <p>When you checkout with your Bangalore address, your orders and real-time tracking will appear here.</p>
                    <button className="btn btn--primary" onClick={onClose}>
                      Explore Streetwear Drop
                    </button>
                  </div>
                ) : (
                  <div className="profile-orders-list">
                    {orders.map((ord, idx) => (
                      <div key={idx} className="order-history-card">
                        <div className="order-history-card__header">
                          <div>
                            <span className="order-id">Order #{ord.id?.slice(0, 8).toUpperCase()}</span>
                            <span className="order-date">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }) : 'Recent'}
                            </span>
                          </div>
                          <span className="order-status-badge">
                            {ord.payment_status === 'PENDING_COD' ? 'Cash On Delivery' : 'Dispatched · Bangalore'}
                          </span>
                        </div>

                        {/* Tracking tracker timeline */}
                        <div className="order-history-tracker">
                          <div className="tracker-header">
                            <span className="tracker-eta">⚡ {ord.estimatedDelivery || 'Estimated Delivery: Tomorrow'}</span>
                            <span className="tracker-pin">Bangalore ({ord.pincode})</span>
                          </div>
                          <div className="tracker-bar">
                            <div className="tracker-bar__fill" style={{ width: '60%' }}></div>
                          </div>
                          <div className="tracker-steps">
                            <span className="step done">Confirmed</span>
                            <span className="step done">Packed</span>
                            <span className="step active">In Transit</span>
                            <span className="step">Delivered</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="order-history-items">
                          {ord.items?.map((it, i) => (
                            <div key={i} className="order-history-item-line">
                              <div className="item-thumbnail">
                                <Image
                                  src={it.image || '/images/products/geometric-shirt-front.jpg'}
                                  alt={it.name}
                                  width={40}
                                  height={50}
                                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                                />
                              </div>
                              <div className="item-details">
                                <span className="item-title">{it.name}</span>
                                <span className="item-meta">Size: {it.size} · Color: {it.color} · Qty: {it.quantity}</span>
                              </div>
                              <span className="item-subtotal">₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>

                        <div className="order-history-card__footer">
                          <span>Total Paid: <strong>₹{ord.total_amount?.toLocaleString('en-IN')}</strong></span>
                          <span className="waybill">Waybill: {ord.trackingNumber || `BLR-${(ord.id || '982310').slice(0, 6).toUpperCase()}`}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SAVED ADDRESS TAB */}
            {profileTab === 'address' && (
              <div className="profile-address">
                {savedAddress ? (
                  <div className="profile-saved-address-card">
                    <div className="card-top">
                      <div className="badge-default">DEFAULT DELIVERY ADDRESS</div>
                      <button
                        type="button"
                        className="btn-edit-addr"
                        onClick={() => setSavedAddress(null)}
                      >
                        Edit
                      </button>
                    </div>
                    <h4 className="user-recipient-name">{savedAddress.name || user.name}</h4>
                    <p className="addr-street">{savedAddress.address || savedAddress.street}</p>
                    <p className="addr-city-pin">
                      📍 {savedAddress.city || 'Bangalore'}, {savedAddress.state || 'Karnataka'} - <strong>{savedAddress.pincode}</strong>
                    </p>
                    <p className="addr-phone">📞 {savedAddress.phone || '+91 98765 43210'}</p>
                    <div className="addr-blr-verified">
                      ✓ Validated for Bangalore Express Next-Day Shipping
                    </div>
                  </div>
                ) : (
                  <form className="profile-address-form" onSubmit={handleSaveAddress}>
                    <h4 className="form-heading">Bangalore Delivery Address</h4>
                    <p className="form-sub">Save your Bangalore delivery address for 1-click checkout.</p>

                    <div className="profile-form__field">
                      <label>Street Address / Flat / Building *</label>
                      <input
                        name="address"
                        type="text"
                        required
                        placeholder="Flat 302, Palm Grove, 12th Main Road, Indiranagar"
                        className="profile-form__input"
                      />
                    </div>

                    <div className="profile-form__row">
                      <div className="profile-form__field">
                        <label>City *</label>
                        <input
                          name="city"
                          type="text"
                          readOnly
                          defaultValue="Bangalore"
                          className="profile-form__input readonly"
                        />
                      </div>
                      <div className="profile-form__field">
                        <label>State *</label>
                        <input
                          name="state"
                          type="text"
                          readOnly
                          defaultValue="Karnataka"
                          className="profile-form__input readonly"
                        />
                      </div>
                    </div>

                    <div className="profile-form__row">
                      <div className="profile-form__field">
                        <label>Bangalore PIN Code (560xxx) *</label>
                        <input
                          name="pincode"
                          type="text"
                          required
                          maxLength={6}
                          placeholder="560038"
                          className="profile-form__input"
                        />
                      </div>
                      <div className="profile-form__field">
                        <label>Contact Phone *</label>
                        <input
                          name="phone"
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          className="profile-form__input"
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn--primary btn--full">
                      Save Bangalore Address
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show Auth / Sign in form
  return (
    <div className="account-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="account-modal__container" onClick={e => e.stopPropagation()}>
        <button className="account-modal__close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="account-modal__header">
          <div className="account-modal__logo">wr<span>fitzz</span>.</div>
          <p className="account-modal__subtitle">Streetwear crafted for the bold · Bangalore Hub</p>
        </div>

        <div className="account-modal__tabs">
          <button
            className={`account-modal__tab ${tab === 'login' ? 'account-modal__tab--active' : ''}`}
            onClick={() => { setTab('login'); setSubmitted(false); }}
          >
            Sign In
          </button>
          <button
            className={`account-modal__tab ${tab === 'register' ? 'account-modal__tab--active' : ''}`}
            onClick={() => { setTab('register'); setSubmitted(false); }}
          >
            Create Account
          </button>
        </div>

        {submitted ? (
          <div className="account-modal__success">
            <div className="account-modal__success-icon">✓</div>
            <h3>{tab === 'login' ? 'Welcome Back!' : 'Account Created!'}</h3>
            <p>You are now signed in to wrfitzz.</p>
          </div>
        ) : (
          <form className="account-modal__form" onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sumit Mishra"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn btn--primary btn--full btn--lg">
              {tab === 'login' ? 'SIGN IN TO WRFITZZ' : 'CREATE ACCOUNT'}
            </button>

            <div className="account-modal__perks">
              <span>🎁 10% Off on Prepaid Orders</span>
              <span>⚡ Bangalore Express Shipping</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
