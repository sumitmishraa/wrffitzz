'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

// Bangalore pincodes range (560001 - 560117 and surrounding areas)
const BANGALORE_PINCODES = [];
for (let i = 560001; i <= 560117; i++) BANGALORE_PINCODES.push(String(i));
// Add extended Bangalore urban/rural pincodes
for (let i = 561101; i <= 561230; i++) BANGALORE_PINCODES.push(String(i));
for (let i = 562101; i <= 562165; i++) BANGALORE_PINCODES.push(String(i));

function isBangalorePincode(pin) {
  if (!pin) return false;
  const cleanPin = pin.replace(/\D/g, '');
  if (cleanPin.length !== 6) return false;
  return BANGALORE_PINCODES.includes(cleanPin);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice } = useCart();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [pincodeValid, setPincodeValid] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '',
  });

  // Sync user profile from AuthContext
  useEffect(() => {
    if (user) {
      const cleanPhone = (user.phone || '').replace(/\+91|\D/g, '').slice(-10);
      setForm(prev => ({
        ...prev,
        customer_phone: prev.customer_phone || cleanPhone,
        customer_name: prev.customer_name || (user.name !== 'wrfitzz Member' ? user.name : ''),
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    try {
      // Auto-load saved address
      const savedAddressStr = localStorage.getItem('wrfitzz_saved_address') || localStorage.getItem('wrfitzz-saved-address');
      if (savedAddressStr) {
        const addr = JSON.parse(savedAddressStr);
        setForm(prev => ({
          ...prev,
          shipping_address: prev.shipping_address || addr.address || addr.street || '',
          city: prev.city || addr.city || 'Bangalore',
          state: prev.state || addr.state || 'Karnataka',
          pincode: prev.pincode || addr.pincode || '',
          customer_phone: prev.customer_phone || addr.phone || '',
          customer_name: prev.customer_name || addr.name || '',
        }));
        if (addr.pincode && isBangalorePincode(addr.pincode)) {
          setPincodeValid(true);
        }
      } else {
        const savedPin = localStorage.getItem('wrfitzz_pincode');
        if (savedPin) {
          setForm(prev => ({ ...prev, pincode: savedPin }));
          if (isBangalorePincode(savedPin)) {
            setPincodeValid(true);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read saved checkout info', e);
    }
  }, []);

  const shippingCost = totalPrice >= 2999 ? 0 : 199;
  const finalTotal = totalPrice + shippingCost;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'pincode') {
      const cleanPin = value.replace(/\D/g, '');
      if (cleanPin.length === 6) {
        if (isBangalorePincode(cleanPin)) {
          setPincodeValid(true);
          setPincodeError('');
          setForm(prev => ({ ...prev, city: 'Bangalore', state: 'Karnataka' }));
        } else {
          setPincodeValid(false);
          setPincodeError('coming_soon');
        }
      } else {
        setPincodeValid(false);
        setPincodeError('');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Validate Bangalore delivery
    if (!isBangalorePincode(form.pincode)) {
      setPincodeError('coming_soon');
      return;
    }

    setLoading(true);

    const pendingOrder = {
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      shipping_address: form.shipping_address,
      city: form.city || 'Bangalore',
      state: form.state || 'Karnataka',
      pincode: form.pincode,
      subtotal: totalPrice,
      shipping: shippingCost,
      total_amount: finalTotal,
      items: items.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.price,
        image: item.image,
      })),
      created_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem('wrfitzz_pending_order', JSON.stringify(pendingOrder));
      localStorage.setItem('wrfitzz_saved_address', JSON.stringify({
        address: form.shipping_address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        phone: form.customer_phone,
        name: form.customer_name,
      }));

      // Persist profile to Supabase if logged in
      if (user?.phone) {
        updateProfile({
          name: form.customer_name,
          email: form.customer_email,
        });
      }
    } catch (err) {
      console.warn('LocalStorage save error', err);
    }

    // Direct user to the payment page as requested
    router.push('/payment');
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-empty">
            <div className="checkout-empty__icon">🛍️</div>
            <h2 className="checkout-empty__title">Your bag is empty</h2>
            <p className="checkout-empty__text">Add your favorite streetwear fits before heading to checkout.</p>
            <Link href="/shop" className="btn btn--primary btn--lg">
              Explore Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isFormValid =
    form.customer_name.trim() &&
    form.customer_email.trim() &&
    form.customer_phone.trim() &&
    form.shipping_address.trim() &&
    pincodeValid;

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="checkout-breadcrumb">
          <Link href="/cart">Bag</Link>
          <span className="checkout-breadcrumb__sep">/</span>
          <span className="checkout-breadcrumb__current">Delivery &amp; Details</span>
          <span className="checkout-breadcrumb__sep">/</span>
          <span className="checkout-breadcrumb__future">Payment</span>
        </div>

        <div className="checkout-header-row">
          <div>
            <h1 className="checkout-page__title">Checkout</h1>
            <p className="checkout-page__subtitle">Fast Bangalore delivery &amp; express handling</p>
          </div>
          <div className="checkout-step-badge">
            Step 1 of 2: Shipping
          </div>
        </div>

        <div className="checkout-page__layout">
          {/* Left Column: Delivery Form */}
          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* Step 1: Contact Information */}
            <div className="checkout-card">
              <div className="checkout-card__header">
                <div className="checkout-card__step-num">1</div>
                <div>
                  <h2 className="checkout-card__title">Contact Information</h2>
                  <p className="checkout-card__desc">We will send your order tracking and Bangalore delivery updates here.</p>
                </div>
              </div>
              <div className="checkout-card__body">
                {user ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    backgroundColor: 'rgba(45, 106, 79, 0.15)',
                    border: '1px solid rgba(45, 106, 79, 0.35)',
                    borderRadius: '6px',
                    color: '#2D6A4F',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '16px',
                  }}>
                    <span>✓</span>
                    <span>Logged in with Mobile OTP: <strong>{user.phone}</strong> (Phone Verified)</span>
                  </div>
                ) : (
                  <div style={{
                    padding: '8px 14px',
                    backgroundColor: '#262624',
                    border: '1px solid #3A3A36',
                    borderRadius: '6px',
                    color: '#CCCCCC',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}>
                    💡 Complete contact details below to receive Bangalore express dispatch notifications.
                  </div>
                )}
                <div className="checkout-form__grid">
                  <div className="checkout-form__field checkout-form__field--full">
                    <label className="checkout-form__label" htmlFor="customer_name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="customer_name"
                      name="customer_name"
                      type="text"
                      required
                      className="checkout-form__input"
                      placeholder="e.g. Rahul Sharma"
                      value={form.customer_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="checkout-form__field">
                    <label className="checkout-form__label" htmlFor="customer_email">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                      required
                      className="checkout-form__input"
                      placeholder="rahul@example.com"
                      value={form.customer_email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="checkout-form__field">
                    <label className="checkout-form__label" htmlFor="customer_phone">
                      Mobile Number <span className="req">*</span>
                    </label>
                    <div className="checkout-form__phone-wrap">
                      <span className="checkout-form__phone-prefix">+91</span>
                      <input
                        id="customer_phone"
                        name="customer_phone"
                        type="tel"
                        required
                        maxLength={10}
                        className="checkout-form__input checkout-form__input--phone"
                        placeholder="98765 43210"
                        value={form.customer_phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Address with Bangalore Validation */}
            <div className="checkout-card">
              <div className="checkout-card__header">
                <div className="checkout-card__step-num">2</div>
                <div>
                  <h2 className="checkout-card__title">Delivery Address</h2>
                  <p className="checkout-card__desc">Currently serving all areas across Bangalore city.</p>
                </div>
              </div>
              <div className="checkout-card__body">
                {/* Bangalore Exclusive Service Banner */}
                <div className="bangalore-service-pill">
                  <span className="bangalore-service-pill__dot"></span>
                  <span><strong>Bangalore Exclusive Delivery:</strong> Express next-day dispatch guaranteed across Bengaluru</span>
                </div>

                <div className="checkout-form__grid">
                  <div className="checkout-form__field checkout-form__field--full">
                    <label className="checkout-form__label" htmlFor="shipping_address">
                      Street Address &amp; Flat / House No. <span className="req">*</span>
                    </label>
                    <input
                      id="shipping_address"
                      name="shipping_address"
                      type="text"
                      required
                      className="checkout-form__input"
                      placeholder="Apartment, Studio, Street name, Landmark"
                      value={form.shipping_address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="checkout-form__field">
                    <label className="checkout-form__label" htmlFor="pincode">
                      Bangalore PIN Code <span className="req">*</span>
                    </label>
                    <div className="checkout-form__pincode-box">
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        required
                        maxLength={6}
                        className={`checkout-form__input ${pincodeError ? 'checkout-form__input--error' : ''} ${pincodeValid ? 'checkout-form__input--success' : ''}`}
                        placeholder="e.g. 560038"
                        value={form.pincode}
                        onChange={handleChange}
                      />
                      {pincodeValid && (
                        <span className="checkout-pincode-status success">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          Bangalore Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="checkout-form__field">
                    <label className="checkout-form__label" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      readOnly
                      className="checkout-form__input checkout-form__input--readonly"
                      value={form.city}
                    />
                  </div>

                  <div className="checkout-form__field checkout-form__field--full">
                    <label className="checkout-form__label" htmlFor="state">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      readOnly
                      className="checkout-form__input checkout-form__input--readonly"
                      value={form.state}
                    />
                  </div>
                </div>

                {/* Coming soon banner if non-Bangalore pin entered */}
                {pincodeError === 'coming_soon' && (
                  <div className="checkout-coming-soon-card">
                    <div className="checkout-coming-soon-card__badge">Coming Soon</div>
                    <h4 className="checkout-coming-soon-card__title">
                      We are currently delivering exclusively in Bangalore!
                    </h4>
                    <p className="checkout-coming-soon-card__text">
                      wrfitzz is expanding rapidly across India. We will be coming soon to your city. Please enter a Bangalore PIN code (e.g. 560001, 560038, 560095) to proceed with your order today.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action: Proceed to Pay */}
            <div className="checkout-submit-card">
              <button
                type="submit"
                className={`checkout-submit-btn ${isFormValid ? 'checkout-submit-btn--ready' : ''}`}
                disabled={loading || !isFormValid}
              >
                <div className="checkout-submit-btn__inner">
                  <span className="checkout-submit-btn__lock">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <span className="checkout-submit-btn__text">
                    {loading ? 'Validating...' : `PROCEED TO PAY · ₹${finalTotal.toLocaleString('en-IN')}`}
                  </span>
                  <span className="checkout-submit-btn__arrow">→</span>
                </div>
              </button>

              <div className="checkout-reassurance-row">
                <div className="checkout-reassurance-item">
                  <svg width="15" height="15" fill="none" stroke="#2D6A4F" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span>Encrypted 256-Bit SSL</span>
                </div>
                <div className="checkout-reassurance-item">
                  <svg width="15" height="15" fill="none" stroke="#2D6A4F" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  <span>Free Bangalore Shipping over ₹2,999</span>
                </div>
                <div className="checkout-reassurance-item">
                  <svg width="15" height="15" fill="none" stroke="#2D6A4F" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span>15-Day Easy Returns</span>
                </div>
              </div>
            </div>
          </form>

          {/* Right Column: Premium Elevated Order Summary */}
          <aside className="checkout-summary-col">
            <div className="checkout-summary-card">
              <div className="checkout-summary-card__head">
                <h3 className="checkout-summary-card__title">Order Summary</h3>
                <span className="checkout-summary-card__items-count">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="checkout-summary-items">
                {items.map(item => (
                  <div key={item.key} className="checkout-summary-item">
                    <div className="checkout-summary-item__img-box">
                      <Image
                        src={item.image || '/images/products/geometric-shirt-front.jpg'}
                        alt={item.name}
                        width={68}
                        height={85}
                        className="checkout-summary-item__img"
                        style={{ objectFit: 'cover' }}
                      />
                      <span className="checkout-summary-item__badge">{item.quantity}</span>
                    </div>
                    <div className="checkout-summary-item__info">
                      <h4 className="checkout-summary-item__name">{item.name}</h4>
                      <p className="checkout-summary-item__spec">
                        <span>Size: <strong>{item.size}</strong></span>
                        <span className="sep">·</span>
                        <span>Color: <strong>{item.color}</strong></span>
                      </p>
                      <p className="checkout-summary-item__unit">₹{item.price.toLocaleString('en-IN')} each</p>
                    </div>
                    <div className="checkout-summary-item__price">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-divider" />

              {/* Price Calculations */}
              <div className="checkout-calc-rows">
                <div className="checkout-calc-row">
                  <span className="label">Subtotal</span>
                  <span className="value">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="checkout-calc-row">
                  <span className="label">Bangalore Delivery</span>
                  <span className={`value ${shippingCost === 0 ? 'free-tag' : ''}`}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>

                {shippingCost > 0 && (
                  <div className="checkout-free-shipping-hint">
                    Add ₹{(2999 - totalPrice).toLocaleString('en-IN')} more to unlock <strong>FREE DELIVERY</strong>
                  </div>
                )}

                <div className="checkout-calc-row">
                  <span className="label">Applicable Taxes (GST 12%)</span>
                  <span className="value muted">Included</span>
                </div>
              </div>

              <div className="checkout-summary-divider checkout-summary-divider--thick" />

              {/* Final Total */}
              <div className="checkout-total-block">
                <div>
                  <span className="checkout-total-label">Total to Pay</span>
                  <span className="checkout-total-currency">INR (Indian Rupee)</span>
                </div>
                <div className="checkout-total-amount">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Trust Badge at bottom of summary */}
              <div className="checkout-summary-trust-footer">
                <div className="checkout-trust-shield">
                  <svg width="18" height="18" fill="none" stroke="#2D6A4F" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div className="checkout-trust-text">
                  <strong>Official wrfitzz Guarantee</strong>
                  <p>Authentic streetwear drops dispatched from Bangalore warehouse.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
