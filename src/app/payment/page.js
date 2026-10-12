'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/api';

export default function PaymentPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderDraft, setOrderDraft] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'cod'
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrfitzz_pending_order');
      if (saved) {
        setOrderDraft(JSON.parse(saved));
      } else {
        // Demo Bangalore order draft for seamless preview/testing
        const mockDraft = {
          customer_name: 'Rahul Sharma',
          customer_email: 'rahul@example.com',
          customer_phone: '98765 43210',
          shipping_address: 'Flat 402, Prestige Palms, 100 Feet Road, Indiranagar',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038',
          subtotal: 4498,
          shipping: 0,
          total_amount: 4498,
          items: [
            {
              id: 'mock-1',
              name: 'Artisan Geometric Print Shirt',
              quantity: 1,
              size: 'M',
              color: 'Beige & Black',
              price: 2499,
              image: '/images/products/geometric-shirt-front.jpg',
            },
            {
              id: 'mock-2',
              name: 'Noir Classic Tailored Trousers',
              quantity: 1,
              size: '32',
              color: 'Noir Black',
              price: 1999,
              image: '/images/products/black-trousers.jpg',
            },
          ],
        };
        setOrderDraft(mockDraft);
      }
    } catch (e) {
      console.warn('Could not read pending order', e);
    }
  }, [router]);

  if (!orderDraft && !orderConfirmed) {
    return (
      <div className="payment-page">
        <div className="container text-center py-20">
          <p>Loading payment session...</p>
        </div>
      </div>
    );
  }

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create order in Supabase
      const payload = {
        customer_name: orderDraft.customer_name,
        customer_email: orderDraft.customer_email,
        customer_phone: orderDraft.customer_phone,
        shipping_address: `${orderDraft.shipping_address}, ${orderDraft.city}, ${orderDraft.state} - ${orderDraft.pincode}`,
        city: orderDraft.city,
        state: orderDraft.state,
        pincode: orderDraft.pincode,
        total_amount: orderDraft.total_amount,
        items: orderDraft.items,
        payment_method: selectedMethod.toUpperCase(),
        payment_status: selectedMethod === 'cod' ? 'PENDING_COD' : 'PAID_TEST_MODE',
      };

      const result = await createOrder(payload);

      const finalOrder = {
        id: result?.id || `WRF-${Date.now().toString().slice(-6)}`,
        ...payload,
        createdAt: new Date().toISOString(),
        trackingNumber: `BLR-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
        estimatedDelivery: 'Tomorrow, by 8:00 PM',
        deliveryCity: 'Bangalore',
      };

      // Save order into user orders history in localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('wrfitzz_orders') || '[]');
        existing.unshift(finalOrder);
        localStorage.setItem('wrfitzz_orders', JSON.stringify(existing));
        localStorage.removeItem('wrfitzz_pending_order');
      } catch (err) {
        console.warn('Could not save to order history', err);
      }

      // Clear the cart
      clearCart();

      setConfirmedOrder(finalOrder);
      setOrderConfirmed(true);
    } catch (err) {
      console.error('Payment processing error', err);
      alert('Could not complete order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN
  if (orderConfirmed && confirmedOrder) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="order-success-card">
            <div className="order-success-icon-wrap">
              <div className="order-success-icon">
                <svg width="40" height="40" fill="none" stroke="#2D6A4F" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <span className="order-success-badge">ORDER CONFIRMED</span>
            <h1 className="order-success-title">Thank You, {confirmedOrder.customer_name}!</h1>
            <p className="order-success-subtitle">
              Your order <strong>#{confirmedOrder.id.slice(0, 8).toUpperCase()}</strong> has been placed successfully.
              A confirmation email has been dispatched to <strong>{confirmedOrder.customer_email}</strong>.
            </p>

            <div className="order-delivery-status-box">
              <div className="order-delivery-status-header">
                <div>
                  <span className="order-delivery-tag">BANGALORE EXPRESS DISPATCH</span>
                  <h3 className="order-delivery-eta">Estimated Delivery: {confirmedOrder.estimatedDelivery}</h3>
                </div>
                <div className="order-delivery-pincode">
                  📍 Bangalore - {confirmedOrder.pincode}
                </div>
              </div>

              {/* Delivery tracking visual bar */}
              <div className="order-timeline">
                <div className="order-timeline__step completed">
                  <div className="order-timeline__dot">✓</div>
                  <span className="order-timeline__label">Order Confirmed</span>
                </div>
                <div className="order-timeline__line completed"></div>
                <div className="order-timeline__step active">
                  <div className="order-timeline__dot">📦</div>
                  <span className="order-timeline__label">Packing in Warehouse</span>
                </div>
                <div className="order-timeline__line"></div>
                <div className="order-timeline__step">
                  <div className="order-timeline__dot">🚚</div>
                  <span className="order-timeline__label">Out for Delivery</span>
                </div>
                <div className="order-timeline__line"></div>
                <div className="order-timeline__step">
                  <div className="order-timeline__dot">🏡</div>
                  <span className="order-timeline__label">Delivered</span>
                </div>
              </div>

              <div className="order-tracking-info">
                <span>Bangalore Courier Waybill: <strong>{confirmedOrder.trackingNumber}</strong></span>
                <span>Delivery Address: {confirmedOrder.shipping_address}</span>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="order-items-preview">
              <h4 className="order-items-preview__title">Order Items ({confirmedOrder.items.length})</h4>
              <div className="order-items-preview__list">
                {confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <div className="order-item-row__img-box">
                      <Image
                        src={item.image || '/images/products/geometric-shirt-front.jpg'}
                        alt={item.name}
                        width={50}
                        height={60}
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </div>
                    <div className="order-item-row__info">
                      <div className="order-item-row__name">{item.name}</div>
                      <div className="order-item-row__meta">Size: {item.size} · Color: {item.color} · Qty: {item.quantity}</div>
                    </div>
                    <div className="order-item-row__price">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-items-preview__total">
                <span>Total Paid:</span>
                <strong>₹{confirmedOrder.total_amount.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="order-success-actions">
              <Link href="/shop" className="btn btn--primary btn--lg">
                Continue Shopping
              </Link>
              <button
                type="button"
                className="btn btn--outline btn--lg"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('wrfitzz_open_profile_orders'));
                  router.push('/');
                }}
              >
                View in Profile / Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="checkout-breadcrumb">
          <Link href="/cart">Bag</Link>
          <span className="checkout-breadcrumb__sep">/</span>
          <Link href="/checkout">Shipping</Link>
          <span className="checkout-breadcrumb__sep">/</span>
          <span className="checkout-breadcrumb__current">Payment</span>
        </div>

        <div className="checkout-header-row">
          <div>
            <h1 className="checkout-page__title">Select Payment Method</h1>
            <p className="checkout-page__subtitle">All major Indian payment modes supported · 100% Secure SSL</p>
          </div>
          <div className="checkout-step-badge">
            Step 2 of 2: Payment
          </div>
        </div>

        {/* Integration notice */}
        <div className="payment-integration-notice">
          <div className="payment-integration-notice__icon">ℹ️</div>
          <div className="payment-integration-notice__text">
            <strong>Payment Gateway Integration Mode</strong>
            <p>Live payment gateway (Razorpay / Cashfree) credentials will be hooked up here. You can select any payment mode below and click &quot;Complete Payment&quot; to test the order confirmation flow.</p>
          </div>
        </div>

        <div className="checkout-page__layout">
          {/* Left: Payment Options */}
          <div className="payment-methods-card">
            <h2 className="payment-card-title">Choose Payment Option</h2>

            <div className="payment-methods-tabs">
              {/* UPI Option */}
              <label
                className={`payment-method-row ${selectedMethod === 'upi' ? 'payment-method-row--selected' : ''}`}
                onClick={() => setSelectedMethod('upi')}
              >
                <div className="payment-method-radio">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={selectedMethod === 'upi'}
                    onChange={() => setSelectedMethod('upi')}
                  />
                </div>
                <div className="payment-method-icon">📱</div>
                <div className="payment-method-info">
                  <strong className="payment-method-name">UPI (GPay / PhonePe / Paytm / BHIM)</strong>
                  <span className="payment-method-sub">Instant zero-fee payment directly from your bank</span>
                </div>
                <span className="payment-method-badge">Recommended</span>
              </label>

              {selectedMethod === 'upi' && (
                <div className="payment-method-details animate-fadeIn">
                  <p className="payment-method-instruction">Enter your UPI VPA ID or scan QR:</p>
                  <div className="upi-input-group">
                    <input
                      type="text"
                      className="checkout-form__input"
                      placeholder="e.g. yourname@okhdfcbank"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                    />
                    <button type="button" className="upi-verify-btn">Verify</button>
                  </div>
                  <div className="upi-quick-apps">
                    <span className="upi-quick-label">Or pay directly using:</span>
                    <div className="upi-app-chips">
                      <span className="upi-chip">Google Pay</span>
                      <span className="upi-chip">PhonePe</span>
                      <span className="upi-chip">Paytm</span>
                      <span className="upi-chip">CRED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards Option */}
              <label
                className={`payment-method-row ${selectedMethod === 'card' ? 'payment-method-row--selected' : ''}`}
                onClick={() => setSelectedMethod('card')}
              >
                <div className="payment-method-radio">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={selectedMethod === 'card'}
                    onChange={() => setSelectedMethod('card')}
                  />
                </div>
                <div className="payment-method-icon">💳</div>
                <div className="payment-method-info">
                  <strong className="payment-method-name">Credit &amp; Debit Cards</strong>
                  <span className="payment-method-sub">Visa, Mastercard, RuPay, Maestro &amp; American Express</span>
                </div>
              </label>

              {selectedMethod === 'card' && (
                <div className="payment-method-details animate-fadeIn">
                  <div className="card-form-grid">
                    <div className="card-field card-field--full">
                      <label>Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        className="checkout-form__input"
                        placeholder="4532 ···· ···· 8921"
                        value={cardData.number}
                        onChange={e => setCardData({ ...cardData, number: e.target.value })}
                      />
                    </div>
                    <div className="card-field card-field--full">
                      <label>Name on Card</label>
                      <input
                        type="text"
                        className="checkout-form__input"
                        placeholder="Full Name as printed"
                        value={cardData.name}
                        onChange={e => setCardData({ ...cardData, name: e.target.value })}
                      />
                    </div>
                    <div className="card-field">
                      <label>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        className="checkout-form__input"
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                      />
                    </div>
                    <div className="card-field">
                      <label>CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        className="checkout-form__input"
                        placeholder="•••"
                        value={cardData.cvv}
                        onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking */}
              <label
                className={`payment-method-row ${selectedMethod === 'netbanking' ? 'payment-method-row--selected' : ''}`}
                onClick={() => setSelectedMethod('netbanking')}
              >
                <div className="payment-method-radio">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={selectedMethod === 'netbanking'}
                    onChange={() => setSelectedMethod('netbanking')}
                  />
                </div>
                <div className="payment-method-icon">🏦</div>
                <div className="payment-method-info">
                  <strong className="payment-method-name">Net Banking</strong>
                  <span className="payment-method-sub">All major 50+ Indian banks</span>
                </div>
              </label>

              {/* Cash on Delivery for Bangalore */}
              <label
                className={`payment-method-row ${selectedMethod === 'cod' ? 'payment-method-row--selected' : ''}`}
                onClick={() => setSelectedMethod('cod')}
              >
                <div className="payment-method-radio">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={selectedMethod === 'cod'}
                    onChange={() => setSelectedMethod('cod')}
                  />
                </div>
                <div className="payment-method-icon">💵</div>
                <div className="payment-method-info">
                  <strong className="payment-method-name">Cash on Delivery (Bangalore Exclusive)</strong>
                  <span className="payment-method-sub">Pay via cash or UPI at the doorstep upon arrival</span>
                </div>
                <span className="payment-method-badge payment-method-badge--blr">Bangalore Only</span>
              </label>
            </div>

            {/* Pay Button */}
            <div className="payment-action-box">
              <button
                type="button"
                className="checkout-submit-btn checkout-submit-btn--ready"
                onClick={handlePay}
                disabled={loading}
              >
                <div className="checkout-submit-btn__inner">
                  <span className="checkout-submit-btn__lock">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <span className="checkout-submit-btn__text">
                    {loading ? 'Processing Payment...' : `CONFIRM & PAY ₹${orderDraft.total_amount.toLocaleString('en-IN')}`}
                  </span>
                  <span className="checkout-submit-btn__arrow">→</span>
                </div>
              </button>

              <p className="payment-security-note">
                🔒 Your transaction is secured with bank-grade 256-bit AES encryption.
              </p>
            </div>
          </div>

          {/* Right Column: Order & Bangalore Delivery Summary */}
          <aside className="checkout-summary-col">
            <div className="checkout-summary-card">
              {/* Delivery destination card */}
              <div className="payment-dest-card">
                <div className="payment-dest-card__head">
                  <span className="payment-dest-tag">SHIPPING TO</span>
                  <Link href="/checkout" className="payment-dest-edit">Edit</Link>
                </div>
                <h4 className="payment-dest-name">{orderDraft.customer_name}</h4>
                <p className="payment-dest-address">{orderDraft.shipping_address}</p>
                <p className="payment-dest-city">Bangalore, Karnataka - {orderDraft.pincode}</p>
                <p className="payment-dest-contact">📞 +91 {orderDraft.customer_phone}</p>
              </div>

              <div className="checkout-summary-card__head">
                <h3 className="checkout-summary-card__title">Order Items</h3>
                <span className="checkout-summary-card__items-count">
                  {orderDraft.items.length} {orderDraft.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="checkout-summary-items">
                {orderDraft.items.map((item, idx) => (
                  <div key={idx} className="checkout-summary-item">
                    <div className="checkout-summary-item__img-box">
                      <Image
                        src={item.image || '/images/products/geometric-shirt-front.jpg'}
                        alt={item.name}
                        width={56}
                        height={70}
                        className="checkout-summary-item__img"
                        style={{ objectFit: 'cover' }}
                      />
                      <span className="checkout-summary-item__badge">{item.quantity}</span>
                    </div>
                    <div className="checkout-summary-item__info">
                      <h4 className="checkout-summary-item__name">{item.name}</h4>
                      <p className="checkout-summary-item__spec">
                        Size: {item.size} · {item.color}
                      </p>
                    </div>
                    <div className="checkout-summary-item__price">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-divider" />

              <div className="checkout-calc-rows">
                <div className="checkout-calc-row">
                  <span className="label">Subtotal</span>
                  <span className="value">₹{orderDraft.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="checkout-calc-row">
                  <span className="label">Bangalore Delivery</span>
                  <span className={`value ${orderDraft.shipping === 0 ? 'free-tag' : ''}`}>
                    {orderDraft.shipping === 0 ? 'FREE' : `₹${orderDraft.shipping}`}
                  </span>
                </div>
              </div>

              <div className="checkout-summary-divider checkout-summary-divider--thick" />

              <div className="checkout-total-block">
                <div>
                  <span className="checkout-total-label">Total Amount</span>
                </div>
                <div className="checkout-total-amount">
                  ₹{orderDraft.total_amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
