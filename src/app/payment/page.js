'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/api';

// Helper to ensure Razorpay Checkout script is loaded
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderDraft, setOrderDraft] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('razorpay'); // 'razorpay' | 'cod'
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrfitzz_pending_order');
      if (saved) {
        setOrderDraft(JSON.parse(saved));
      } else {
        // Fallback Bangalore order draft for seamless preview/testing
        const mockDraft = {
          customer_name: 'Rahul Sharma',
          customer_email: 'rahul@example.com',
          customer_phone: '9876543210',
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

  // Handle Razorpay Standard Checkout & COD
  const handlePay = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setLoading(true);

    // Flow 1: Cash On Delivery (Bangalore Exclusive)
    if (selectedMethod === 'cod') {
      try {
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
          payment_method: 'COD',
          payment_status: 'PENDING_COD',
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

        try {
          const existing = JSON.parse(localStorage.getItem('wrfitzz_orders') || '[]');
          existing.unshift(finalOrder);
          localStorage.setItem('wrfitzz_orders', JSON.stringify(existing));
          localStorage.removeItem('wrfitzz_pending_order');
        } catch (err) {
          console.warn('Could not save to order history', err);
        }

        clearCart();
        setConfirmedOrder(finalOrder);
        setOrderConfirmed(true);
      } catch (err) {
        console.error('COD Order error:', err);
        setPaymentError('Could not process Cash on Delivery order. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Flow 2: Razorpay Standard Web Checkout
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // STEP 1: Backend - Create Order
      const amountInPaise = Math.round(Number(orderDraft.total_amount) * 100);
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            customer_name: orderDraft.customer_name,
            customer_email: orderDraft.customer_email,
            customer_phone: orderDraft.customer_phone,
            pincode: orderDraft.pincode,
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Could not initiate Razorpay order.');
      }

      // STEP 2: Frontend - Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TqCON6C6de1Rv7',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'wrfitzz.',
        description: 'Streetwear Drop · Bangalore Express Order',
        image: '/images/products/geometric-shirt-front.jpg',
        order_id: orderData.order_id,
        prefill: {
          name: orderDraft.customer_name,
          email: orderDraft.customer_email,
          contact: orderDraft.customer_phone,
        },
        theme: {
          color: '#111111',
          backdrop_color: 'rgba(0,0,0,0.85)',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentError('Payment was cancelled. You can retry anytime.');
          },
        },
        // STEP 3: Backend - Verify Signature upon successful payment
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_data: {
                  customer_name: orderDraft.customer_name,
                  customer_email: orderDraft.customer_email,
                  customer_phone: orderDraft.customer_phone,
                  shipping_address: `${orderDraft.shipping_address}, ${orderDraft.city}, ${orderDraft.state} - ${orderDraft.pincode}`,
                  city: orderDraft.city,
                  state: orderDraft.state,
                  pincode: orderDraft.pincode,
                  total_amount: orderDraft.total_amount,
                  items: orderDraft.items,
                  payment_method: 'RAZORPAY',
                  payment_status: 'PAID',
                },
              }),
            });

            const verifyResult = await verifyRes.json();

            if (verifyRes.ok && verifyResult.success) {
              const finalOrder = {
                id: verifyResult.order?.id || `WRF-${response.razorpay_order_id.slice(-6)}`,
                ...orderDraft,
                payment_method: 'RAZORPAY',
                payment_status: 'PAID',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                createdAt: new Date().toISOString(),
                trackingNumber: `BLR-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
                estimatedDelivery: 'Tomorrow, by 8:00 PM',
                deliveryCity: 'Bangalore',
              };

              try {
                const existing = JSON.parse(localStorage.getItem('wrfitzz_orders') || '[]');
                existing.unshift(finalOrder);
                localStorage.setItem('wrfitzz_orders', JSON.stringify(existing));
                localStorage.removeItem('wrfitzz_pending_order');
              } catch (err) {
                console.warn('Could not save order history:', err);
              }

              clearCart();
              setConfirmedOrder(finalOrder);
              setOrderConfirmed(true);
            } else {
              setPaymentError(verifyResult.error || 'Payment signature could not be verified by server.');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setPaymentError('Could not verify payment signature. Please contact store support.');
          } finally {
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp) {
        console.error('Razorpay payment failed:', resp.error);
        setPaymentError(`Payment failed: ${resp.error?.description || resp.error?.reason || 'Transaction could not be completed'}`);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      setPaymentError(err.message || 'Could not initiate Razorpay checkout.');
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
              {confirmedOrder.razorpay_payment_id && (
                <span style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: '#2D6A4F' }}>
                  ✓ Razorpay Payment ID: <strong>{confirmedOrder.razorpay_payment_id}</strong> (Verified)
                </span>
              )}
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
      {/* Load Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

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
            <h1 className="checkout-page__title">Select Payment Mode</h1>
            <p className="checkout-page__subtitle">100% Secure Razorpay Checkout · Bangalore Hub Express</p>
          </div>
          <div className="checkout-step-badge">
            Step 2 of 2: Payment
          </div>
        </div>

        {/* Error notification banner if payment failed or cancelled */}
        {paymentError && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '14px 18px',
            color: '#f87171',
            fontSize: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>⚠️ {paymentError}</span>
            <button
              onClick={() => setPaymentError('')}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="checkout-page__layout">
          {/* Left: Payment Options */}
          <div className="payment-methods-card">
            <h2 className="payment-card-title">Choose Payment Option</h2>

            <div className="payment-methods-tabs">
              {/* Razorpay Standard Checkout (UPI, Cards, Netbanking) */}
              <label
                className={`payment-method-row ${selectedMethod === 'razorpay' ? 'payment-method-row--selected' : ''}`}
                onClick={() => setSelectedMethod('razorpay')}
              >
                <div className="payment-method-radio">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={selectedMethod === 'razorpay'}
                    onChange={() => setSelectedMethod('razorpay')}
                  />
                </div>
                <div className="payment-method-icon">⚡</div>
                <div className="payment-method-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong className="payment-method-name">Razorpay Standard Checkout</strong>
                    <span style={{
                      backgroundColor: '#2D6A4F',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em'
                    }}>
                      RECOMMENDED
                    </span>
                  </div>
                  <span className="payment-method-sub">
                    Instant UPI (GPay, PhonePe, Paytm, CRED), Cards (Visa, Mastercard, RuPay) &amp; Netbanking
                  </span>
                </div>
              </label>

              {selectedMethod === 'razorpay' && (
                <div className="payment-method-details animate-fadeIn" style={{ borderLeft: '2px solid #D4AF37', marginLeft: '12px' }}>
                  <p className="payment-method-instruction" style={{ color: '#F4F4F0', fontWeight: '600' }}>
                    Standard Razorpay Modal Checkout
                  </p>
                  <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 12px' }}>
                    Clicking below will open the official Razorpay checkout modal pre-filled with your verified contact information.
                  </p>
                  <div className="upi-app-chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="upi-chip">📱 Google Pay</span>
                    <span className="upi-chip">⚡ PhonePe</span>
                    <span className="upi-chip">💳 All Debit &amp; Credit Cards</span>
                    <span className="upi-chip">🏦 50+ Netbanking Banks</span>
                  </div>
                </div>
              )}

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
                    {loading
                      ? 'Opening Razorpay...'
                      : (selectedMethod === 'cod'
                          ? `CONFIRM CASH ON DELIVERY · ₹${orderDraft.total_amount.toLocaleString('en-IN')}`
                          : `PAY VIA RAZORPAY · ₹${orderDraft.total_amount.toLocaleString('en-IN')}`
                        )}
                  </span>
                  <span className="checkout-submit-btn__arrow">→</span>
                </div>
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '16px',
                fontSize: '12px',
                color: '#888',
              }}>
                <span>🔒 256-Bit SSL Encrypted</span>
                <span>·</span>
                <span>🛡️ Razorpay Verified Merchant</span>
                <span>·</span>
                <span>📍 Bangalore Express Dispatch</span>
              </div>
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
