'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AccountModal({ isOpen, onClose }) {
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    logout,
    updateProfile,
  } = useAuth();

  // Auth modes: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('login');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Profile tabs for logged-in users: 'overview' | 'orders' | 'address'
  const [profileTab, setProfileTab] = useState('overview');
  const [savedAddress, setSavedAddress] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Load orders & address from localStorage
  useEffect(() => {
    try {
      const addr = localStorage.getItem('wrfitzz_saved_address') || localStorage.getItem('wrfitzz-saved-address');
      if (addr) setSavedAddress(JSON.parse(addr));

      const savedOrders = localStorage.getItem('wrfitzz_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch (e) { /* ignore */ }
  }, [isOpen]);

  // Sync inputs with user
  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setEmailInput(user.email || '');
    }
  }, [user]);

  // Handle orders event
  useEffect(() => {
    const handleOpenOrders = () => setProfileTab('orders');
    window.addEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
    return () => window.removeEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setSubmitted(false);
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1. Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await signInWithGoogle();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 900);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setErrorMsg(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Email Sign-In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 900);
    } catch (err) {
      console.error('Email Sign-In error:', err);
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Email Sign-Up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide an email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, name.trim());
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 900);
    } catch (err) {
      console.error('Email Sign-Up error:', err);
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMsg(`Password reset email sent to ${email}. Please check your inbox!`);
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Save Name & Email in Profile Dashboard
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        name: nameInput.trim(),
        email: emailInput.trim(),
      });
      setEditProfileOpen(false);
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Address in Profile Dashboard
  const handleSaveAddress = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newAddr = {
      address: fd.get('address') || fd.get('line1'),
      city: fd.get('city') || 'Bangalore',
      state: fd.get('state') || 'Karnataka',
      pincode: fd.get('pincode'),
      phone: fd.get('phone') || user?.phone || '',
      name: user?.name || 'Customer',
    };
    localStorage.setItem('wrfitzz_saved_address', JSON.stringify(newAddr));
    setSavedAddress(newAddr);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'W';

  // =========================================================
  // VIEW A: LOGGED IN (Profile Dashboard)
  // =========================================================
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 className="profile-header__name">{user.name || 'wrfitzz Member'}</h3>
                {user.isAdmin && (
                  <span style={{
                    backgroundColor: '#D4AF37',
                    color: '#000',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em'
                  }}>
                    👑 ADMIN
                  </span>
                )}
              </div>
              <p className="profile-header__email">{user.email || user.phone}</p>
              <div className="profile-header__meta">
                <span className="profile-header__badge" style={{ backgroundColor: '#262624', color: '#F4F4F0', border: '1px solid #3A3A36' }}>
                  {user.email || user.phone}
                </span>
                <span className="profile-header__since">Joined {user.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Quick link for Admin */}
          {user.isAdmin && (
            <div style={{
              margin: '12px 24px 0',
              padding: '12px 16px',
              backgroundColor: '#1E1E1E',
              border: '1px solid #333',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <strong style={{ color: '#F4F4F0', fontSize: '14px', display: 'block' }}>Store Admin Privileges Active</strong>
                <span style={{ color: '#888', fontSize: '12px' }}>You have full access to orders, products &amp; role management.</span>
              </div>
              <Link
                href="/admin"
                onClick={onClose}
                className="btn btn--primary"
                style={{ fontSize: '12px', padding: '8px 14px' }}
              >
                Open Admin Portal →
              </Link>
            </div>
          )}

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
            {profileTab === 'overview' && (
              <div className="profile-overview">
                <div className="profile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 className="profile-card__title" style={{ margin: 0 }}>Account Information</h4>
                    <button
                      type="button"
                      onClick={() => setEditProfileOpen(!editProfileOpen)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#D4AF37',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      {editProfileOpen ? 'Cancel' : 'Edit Details'}
                    </button>
                  </div>

                  {!editProfileOpen ? (
                    <div className="profile-info-grid">
                      <div className="profile-info-item">
                        <span className="profile-info-label">Full Name</span>
                        <span className="profile-info-value">{user.name || 'Not provided'}</span>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Email Address</span>
                        <span className="profile-info-value">{user.email || 'Not provided'}</span>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Account Tier</span>
                        <span className="profile-info-value" style={{ color: '#D4AF37', fontWeight: '700' }}>
                          wrfitzz Archival Member
                        </span>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Member Since</span>
                        <span className="profile-info-value">{user.joinedDate}</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="profile-edit-form">
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Full Name</label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          placeholder="Your Name"
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px' }}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Email Address</label>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={e => setEmailInput(e.target.value)}
                          placeholder="name@example.com"
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" disabled={loading} className="btn btn--primary btn--sm">
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditProfileOpen(false)}
                          className="btn btn--secondary btn--sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="profile-card profile-card--perks">
                  <h4 className="profile-card__title">Member Privileges</h4>
                  <ul className="profile-perks-list">
                    <li>✓ Free express shipping on all orders</li>
                    <li>✓ Priority access to Archival capsule releases</li>
                    <li>✓ 10-day seamless size exchanges</li>
                    <li>✓ Direct VIP concierge support via WhatsApp</li>
                  </ul>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    onClick={logout}
                    className="btn btn--secondary btn--full"
                    style={{ color: '#ff6b6b', borderColor: '#442222' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {profileTab === 'orders' && (
              <div className="profile-orders">
                {orders.length === 0 ? (
                  <div className="profile-empty-orders">
                    <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
                      No orders placed yet. Explore our latest drop to make your first purchase.
                    </p>
                    <button onClick={onClose} className="btn btn--primary btn--sm">
                      Explore Collection
                    </button>
                  </div>
                ) : (
                  <div className="profile-orders-list">
                    {orders.map((order, idx) => (
                      <div key={order.id || idx} className="profile-order-card">
                        <div className="profile-order-header">
                          <div>
                            <span className="profile-order-id">Order #{order.id?.slice(-8) || `WRF-${idx + 101}`}</span>
                            <span className="profile-order-date">
                              {new Date(order.date || order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className={`profile-order-status profile-order-status--${order.status || 'confirmed'}`}>
                            {order.status || 'Confirmed'}
                          </span>
                        </div>

                        <div className="profile-order-items">
                          {(order.items || []).map((item, i) => (
                            <div key={i} className="profile-order-item">
                              <span className="profile-order-item-name">
                                {item.name} × {item.quantity}
                              </span>
                              <span className="profile-order-item-price">
                                ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="profile-order-footer">
                          <span>Total Paid:</span>
                          <strong>₹{(order.total || order.amount || 0).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profileTab === 'address' && (
              <div className="profile-address">
                {savedAddress ? (
                  <div className="profile-address-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong>{savedAddress.name || user.name || 'Saved Address'}</strong>
                        <p style={{ margin: '6px 0', color: '#CCCCCC', fontSize: '13px', lineHeight: 1.5 }}>
                          {savedAddress.address}<br />
                          {savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}
                        </p>
                        <p style={{ color: '#888', fontSize: '12px' }}>Phone: {savedAddress.phone || user.phone || 'N/A'}</p>
                      </div>
                      <button
                        onClick={() => setSavedAddress(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#D4AF37',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAddress} className="profile-address-form">
                    <div className="profile-form__field">
                      <label>Delivery Address Line *</label>
                      <input
                        name="address"
                        type="text"
                        required
                        placeholder="House / Flat No., Street, Area"
                        className="profile-form__input"
                      />
                    </div>

                    <div className="profile-form__row">
                      <div className="profile-form__field">
                        <label>City *</label>
                        <input
                          name="city"
                          type="text"
                          required
                          defaultValue="Bangalore"
                          className="profile-form__input"
                        />
                      </div>
                      <div className="profile-form__field">
                        <label>State *</label>
                        <input
                          name="state"
                          type="text"
                          required
                          defaultValue="Karnataka"
                          className="profile-form__input"
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
                          defaultValue={user.phone || ''}
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

  // =========================================================
  // VIEW B: NOT LOGGED IN (Google 1-Click + Email Auth ONLY)
  // =========================================================
  return (
    <div className="account-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="account-modal__container" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <button className="account-modal__close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {/* Brand Header */}
        <div className="account-modal__header" style={{ marginBottom: '20px' }}>
          <div className="account-modal__logo">wr<span>fitzz</span>.</div>
          <p className="account-modal__subtitle">Streetwear crafted for the bold · Bangalore Hub</p>
        </div>

        {submitted ? (
          <div className="account-modal__success" style={{ textAlign: 'center', padding: '36px 12px' }}>
            <div className="account-modal__success-icon" style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#D4AF37',
              color: '#000',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontWeight: '700'
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#F4F4F0', marginBottom: '8px' }}>
              Welcome to wrfitzz!
            </h3>
            <p style={{ color: '#A0A09B', fontSize: '14px' }}>Loading your account profile...</p>
          </div>
        ) : authMode === 'forgot' ? (
          /* =========================================================
             FORGOT PASSWORD VIEW
             ========================================================= */
          <form className="account-modal__form" onSubmit={handlePasswordReset}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F4F4F0', marginBottom: '6px' }}>
                Reset Password
              </h3>
              <p style={{ fontSize: '13px', color: '#A0A09B' }}>
                Enter your email address to receive a secure password reset link.
              </p>
            </div>

            {errorMsg && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#f87171',
                fontSize: '13px',
                marginBottom: '16px',
                lineHeight: 1.4,
              }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#4ade80',
                fontSize: '13px',
                marginBottom: '16px',
                lineHeight: 1.4,
              }}>
                {successMsg}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC', display: 'block', marginBottom: '6px' }}>
                Account Email <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn btn--primary btn--full btn--lg"
            >
              {loading ? 'SENDING RESET LINK...' : 'SEND RESET LINK →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D4AF37',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* =========================================================
             GOOGLE SIGN-IN + EMAIL AUTH (LOGIN & SIGNUP TABS)
             ========================================================= */
          <div>
            {/* 1. Google 1-Click Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                color: '#1F1F1F',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              {loading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '18px 0',
              color: '#777777',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#333330' }}></div>
              <span style={{ padding: '0 12px' }}>or with email</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#333330' }}></div>
            </div>

            {/* Tabs: Sign In / Create Account */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '18px',
              borderBottom: '1px solid #2B2B28',
            }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: authMode === 'login' ? '2px solid #D4AF37' : '2px solid transparent',
                  color: authMode === 'login' ? '#F4F4F0' : '#888',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: authMode === 'signup' ? '2px solid #D4AF37' : '2px solid transparent',
                  color: authMode === 'signup' ? '#F4F4F0' : '#888',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#f87171',
                fontSize: '13px',
                marginBottom: '16px',
                lineHeight: 1.4,
              }}>
                {errorMsg}
              </div>
            )}

            {authMode === 'login' ? (
              /* TAB 1: EMAIL SIGN IN */
              <form className="account-modal__form" onSubmit={handleEmailSignIn}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC', display: 'block', marginBottom: '6px' }}>
                    Email Address <span style={{ color: '#D4AF37' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC' }}>
                      Password <span style={{ color: '#D4AF37' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#D4AF37',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="btn btn--primary btn--full btn--lg"
                  style={{ marginTop: '4px' }}
                >
                  {loading ? 'SIGNING IN...' : 'SIGN IN →'}
                </button>
              </form>
            ) : (
              /* TAB 2: EMAIL SIGN UP */
              <form className="account-modal__form" onSubmit={handleEmailSignUp}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC', display: 'block', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Alex Miller"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC', display: 'block', marginBottom: '6px' }}>
                    Email Address <span style={{ color: '#D4AF37' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC', display: 'block', marginBottom: '6px' }}>
                    Password (Min. 6 characters) <span style={{ color: '#D4AF37' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password || password.length < 6}
                  className="btn btn--primary btn--full btn--lg"
                  style={{ marginTop: '4px' }}
                >
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
