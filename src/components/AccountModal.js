'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AccountModal({ isOpen, onClose }) {
  const { user, sendOtp, verifyOtp, logout, updateProfile } = useAuth();

  // Auth flow states: 'phone' | 'otp'
  const [authStep, setAuthStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Profile tabs: 'overview' | 'orders' | 'address'
  const [profileTab, setProfileTab] = useState('overview');
  const [savedAddress, setSavedAddress] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Load orders & address
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
    const handleOpenOrders = () => {
      setProfileTab('orders');
    };
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
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Resend Countdown timer
  useEffect(() => {
    let interval = null;
    if (authStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [authStep, resendTimer]);

  if (!isOpen) return null;

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoNotice('');

    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(phone, 'recaptcha-container');
      setAuthStep('otp');
      setResendTimer(30);
      setCanResend(false);
      if (res?.notice) {
        setInfoNotice(res.notice);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      let msg = err.message || 'Failed to send OTP. Please check your connection.';
      if (msg.includes('auth/invalid-phone-number')) {
        msg = 'Invalid phone number format. Please provide a 10-digit mobile number.';
      } else if (msg.includes('auth/too-many-requests')) {
        msg = 'Too many requests. Please wait a few minutes before trying again.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp || otp.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(otp.trim(), nameInput, emailInput);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
      }, 1000);
    } catch (err) {
      console.error('Verify OTP error:', err);
      let msg = 'Incorrect OTP code. Please verify and try again.';
      if (err.message?.includes('auth/code-expired')) {
        msg = 'This verification code has expired. Please request a new one.';
      } else if (err.message?.includes('auth/invalid-verification-code')) {
        msg = 'Invalid code entered. Please check the SMS and retry.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Save Name & Email
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

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newAddr = {
      address: fd.get('address') || fd.get('line1'),
      city: fd.get('city') || 'Bangalore',
      state: fd.get('state') || 'Karnataka',
      pincode: fd.get('pincode'),
      phone: fd.get('phone') || user?.phone,
      name: user?.name || 'Customer',
    };
    localStorage.setItem('wrfitzz_saved_address', JSON.stringify(newAddr));
    setSavedAddress(newAddr);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'W';

  // LOGGED IN: Profile Dashboard
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
                  {user.phone}
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

                  {editProfileOpen ? (
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '12px', color: '#999' }}>Full Name</label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          placeholder="Your Name"
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '12px', color: '#999' }}>Email Address</label>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={e => setEmailInput(e.target.value)}
                          placeholder="name@example.com"
                          className="form-input"
                          required
                        />
                      </div>
                      <button type="submit" disabled={loading} className="btn btn--primary btn--sm" style={{ alignSelf: 'flex-start' }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="profile-card__row">
                        <span className="profile-card__label">Mobile Phone</span>
                        <strong className="profile-card__value">{user.phone}</strong>
                      </div>
                      <div className="profile-card__row">
                        <span className="profile-card__label">Full Name</span>
                        <strong className="profile-card__value">{user.name || 'Not provided'}</strong>
                      </div>
                      <div className="profile-card__row">
                        <span className="profile-card__label">Email</span>
                        <strong className="profile-card__value">{user.email || 'Not provided'}</strong>
                      </div>
                      <div className="profile-card__row">
                        <span className="profile-card__label">Status</span>
                        <span className="profile-card__badge-city">📍 Bangalore Hub Verified</span>
                      </div>
                    </>
                  )}
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
                        <strong>Razorpay Instant Checkout</strong>
                        <p>Secure UPI, Card &amp; Netbanking payments</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="button" className="profile-logout-btn" onClick={logout}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                  Sign Out from wrfitzz
                </button>
              </div>
            )}

            {/* ORDERS TAB */}
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
                            {ord.payment_status === 'PAID' ? '✓ Paid via Razorpay' : (ord.payment_status === 'PENDING_COD' ? 'Cash On Delivery' : 'Dispatched')}
                          </span>
                        </div>

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

            {/* ADDRESS TAB */}
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
                    <p className="addr-phone">📞 {savedAddress.phone || user.phone}</p>
                    <div className="addr-blr-verified">
                      ✓ Validated for Bangalore Express Next-Day Shipping
                    </div>
                  </div>
                ) : (
                  <form className="profile-address-form" onSubmit={handleSaveAddress}>
                    <h4 className="form-heading">Bangalore Delivery Address</h4>
                    <p className="form-sub">Save your Bangalore delivery address for fast checkout.</p>

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
                          defaultValue={user.phone}
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

  // NOT LOGGED IN: Phone OTP Authentication
  return (
    <div className="account-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="account-modal__container" onClick={e => e.stopPropagation()}>
        <button className="account-modal__close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {/* Brand Header */}
        <div className="account-modal__header">
          <div className="account-modal__logo">wr<span>fitzz</span>.</div>
          <p className="account-modal__subtitle">Streetwear crafted for the bold · Bangalore Hub</p>
        </div>

        {/* reCAPTCHA container for Firebase invisible verifier */}
        <div id="recaptcha-container"></div>

        {submitted ? (
          <div className="account-modal__success">
            <div className="account-modal__success-icon">✓</div>
            <h3>Verified &amp; Signed In!</h3>
            <p>Welcome to wrfitzz. Loading your profile...</p>
          </div>
        ) : authStep === 'phone' ? (
          /* STEP 1: Phone Input */
          <form className="account-modal__form" onSubmit={handleSendOtp}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F4F4F0', marginBottom: '6px' }}>
                Sign In with Mobile OTP
              </h3>
              <p style={{ fontSize: '13px', color: '#A0A09B' }}>
                Enter your phone number to receive a 6-digit verification code.
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

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC' }}>
                Mobile Number <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  backgroundColor: '#262624',
                  border: '1px solid #3A3A36',
                  borderRadius: '6px',
                  color: '#F4F4F0',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="form-input"
                  style={{ flex: 1 }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: '8px' }}
            >
              {loading ? 'SENDING OTP...' : 'GET VERIFICATION CODE →'}
            </button>
          </form>
        ) : (
          /* STEP 2: OTP Verification */
          <form className="account-modal__form" onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F4F4F0', marginBottom: '6px' }}>
                Enter Verification Code
              </h3>
              <p style={{ fontSize: '13px', color: '#A0A09B' }}>
                Code sent to <strong>+91 {phone}</strong> &nbsp;
                <button
                  type="button"
                  onClick={() => { setAuthStep('phone'); setOtp(''); setErrorMsg(''); setInfoNotice(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D4AF37',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline',
                  }}
                >
                  Change
                </button>
              </p>
            </div>

            {infoNotice && (
              <div style={{
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#D4AF37',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.4,
              }}>
                ℹ️ {infoNotice}
              </div>
            )}

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

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC' }}>
                6-Digit OTP Code <span style={{ color: '#D4AF37' }}>*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="1 2 3 4 5 6"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                style={{
                  fontSize: '22px',
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                  fontWeight: '700',
                  padding: '12px',
                }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="btn btn--primary btn--full btn--lg"
              style={{ marginTop: '8px' }}
            >
              {loading ? 'VERIFYING...' : 'VERIFY & SIGN IN →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#888' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D4AF37',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Resend OTP Code
                </button>
              ) : (
                <span>Resend OTP in <strong>{resendTimer}s</strong></span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
