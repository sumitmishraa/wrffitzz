'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/api';
import { computeTotals, subtotalOf, formatINR, PREPAID_DISCOUNT } from '@/lib/pricing';
import { BagLines, BagTotals } from '@/components/quietstyle/BagSummary';

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

function saveToHistory(order) {
  try {
    const existing = JSON.parse(localStorage.getItem('wrfitzz_orders') || '[]');
    existing.unshift(order);
    localStorage.setItem('wrfitzz_orders', JSON.stringify(existing));
    localStorage.removeItem('wrfitzz_pending_order');
  } catch (err) {
    console.warn('Could not save to order history', err);
  }
}

// Called from event handlers only; kept outside the component so render stays pure.
function orderMeta() {
  return {
    createdAt: new Date().toISOString(),
    trackingNumber: `BLR-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
    estimatedDelivery: 'Tomorrow, by 8:00 PM',
    deliveryCity: 'Bangalore',
  };
}

function localOrderId() {
  return `WRF-${Date.now().toString().slice(-6)}`;
}

function receiptId() {
  return `rcpt_${Date.now().toString().slice(-8)}`;
}

function Steps() {
  return (
    <ol className="qs-pasos" aria-label="Checkout steps">
      <li><b>1</b><Link href="/cart">Bag</Link></li>
      <li><b>2</b><Link href="/checkout">Details</Link></li>
      <li aria-current="step"><b>3</b>Payment</li>
    </ol>
  );
}

export default function PaymentPage() {
  const { clearCart } = useCart();
  const [orderDraft, setOrderDraft] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('razorpay'); // 'razorpay' | 'cod'
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrfitzz_pending_order');
      if (saved) setOrderDraft(JSON.parse(saved));
    } catch (e) {
      console.warn('Could not read pending order', e);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (confirmedOrder) confirmRef.current?.focus();
  }, [confirmedOrder]);

  if (!loaded) {
    return (
      <div className="qs-page" aria-busy="true">
        <div className="qs-page__in"><p className="qs-sub">Loading your order…</p></div>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (confirmedOrder) {
    return (
      <div className="qs-page">
        <div className="qs-page__in">
          <section className="qs-confirmado" aria-labelledby="ok-titulo">
            <span className="qs-confirmado__marca" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
            </span>
            <div className="qs-cab">
              <p className="qs-eyebrow">Order confirmed</p>
              <h1 className="qs-h1" id="ok-titulo" tabIndex={-1} ref={confirmRef}>
                Thank you, {confirmedOrder.customer_name.split(' ')[0]}.
              </h1>
              <p className="qs-sub">
                Order <b>#{String(confirmedOrder.id).slice(0, 10).toUpperCase()}</b> is in. We will message you on
                +91 {confirmedOrder.customer_phone} when it leaves the atelier.
              </p>
            </div>

            <ol className="qs-linea-tiempo" aria-label="Delivery progress">
              <li data-hecho="true">Confirmed</li>
              <li>Packing</li>
              <li>Out for delivery</li>
              <li>Delivered</li>
            </ol>

            <div className="qs-caja">
              <h2 className="qs-caja__titulo">Delivery</h2>
              <dl className="qs-datos">
                <div><dt>Estimated</dt><dd>{confirmedOrder.estimatedDelivery}</dd></div>
                <div><dt>Address</dt><dd>{confirmedOrder.shipping_address}</dd></div>
                <div><dt>Waybill</dt><dd>{confirmedOrder.trackingNumber}</dd></div>
                <div>
                  <dt>Payment</dt>
                  <dd>
                    {confirmedOrder.payment_method === 'COD'
                      ? `Cash on delivery, ${formatINR(confirmedOrder.total_amount)} due at the door`
                      : `Paid online, ${formatINR(confirmedOrder.total_amount)}`}
                    {confirmedOrder.razorpay_payment_id && ` (ref ${confirmedOrder.razorpay_payment_id})`}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="qs-caja">
              <h2 className="qs-caja__titulo">Pieces</h2>
              <BagLines items={confirmedOrder.items} />
            </div>

            <div className="qs-botones">
              <Link href="/shop" className="boton boton--lleno">Keep shopping</Link>
              <button
                type="button"
                className="boton"
                onClick={() => window.dispatchEvent(new CustomEvent('wrfitzz_open_profile_orders'))}
              >
                View your orders
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!orderDraft) {
    return (
      <div className="qs-page">
        <div className="qs-page__in">
          <Steps />
          <div className="qs-empty">
            <h1 className="qs-h1">No order to pay for</h1>
            <p>Start from your bag and add your delivery details first.</p>
            <Link href="/cart" className="boton boton--lleno">Go to your bag</Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = subtotalOf(orderDraft.items);
  const isCod = selectedMethod === 'cod';
  const totals = computeTotals(subtotal, { prepaid: !isCod });
  const codTotals = computeTotals(subtotal, { prepaid: false });
  const onlineTotals = computeTotals(subtotal, { prepaid: true });
  const fullAddress = `${orderDraft.shipping_address}, ${orderDraft.city}, ${orderDraft.state} - ${orderDraft.pincode}`;

  const baseOrder = {
    customer_name: orderDraft.customer_name,
    customer_email: orderDraft.customer_email,
    customer_phone: orderDraft.customer_phone,
    shipping_address: fullAddress,
    city: orderDraft.city,
    state: orderDraft.state,
    pincode: orderDraft.pincode,
    subtotal: totals.subtotal,
    shipping: totals.delivery,
    discount: totals.discount,
    total_amount: totals.total,
    items: orderDraft.items,
  };

  const finish = (order) => {
    saveToHistory(order);
    clearCart();
    setConfirmedOrder(order);
  };

  // Handle Razorpay Standard Checkout & COD
  const handlePay = async () => {
    setPaymentError('');
    setLoading(true);

    // Flow 1: Cash On Delivery (Bangalore Exclusive)
    if (isCod) {
      try {
        const payload = { ...baseOrder, payment_method: 'COD', payment_status: 'PENDING_COD' };
        const result = await createOrder(payload);
        finish({ id: result?.id || localOrderId(), ...payload, ...orderMeta() });
      } catch (err) {
        console.error('COD Order error:', err);
        setPaymentError('We could not place your cash on delivery order. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Flow 2: Razorpay Standard Web Checkout
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('The payment window could not load. Check your connection and try again.');
      }

      // STEP 1: Backend - Create Order (the server prices the items)
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderDraft.items.map((i) => ({ product_id: i.product_id ?? i.id, size: i.size, quantity: i.quantity })),
          currency: 'INR',
          receipt: receiptId(),
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
        throw new Error(orderData.error || 'We could not start the payment.');
      }
      const charged = orderData.amount / 100;

      // STEP 2: Frontend - Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TqCON6C6de1Rv7',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'wrfitzz',
        description: 'Bangalore order',
        image: '/images/products/geometric-shirt-front.jpg',
        order_id: orderData.order_id,
        prefill: {
          name: orderDraft.customer_name,
          email: orderDraft.customer_email,
          contact: orderDraft.customer_phone,
        },
        theme: { color: '#0E0F11', backdrop_color: 'rgba(14,15,17,0.85)' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentError('Payment was cancelled. You can try again whenever you are ready.');
          },
        },
        // STEP 3: Backend - Verify Signature upon successful payment
        handler: async (response) => {
          try {
            setLoading(true);
            const order_data = { ...baseOrder, total_amount: charged, payment_method: 'RAZORPAY', payment_status: 'PAID' };
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_data,
              }),
            });
            const verifyResult = await verifyRes.json();

            if (verifyRes.ok && verifyResult.success) {
              finish({
                id: verifyResult.order?.id || `WRF-${response.razorpay_order_id.slice(-6)}`,
                ...order_data,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                ...orderMeta(),
              });
            } else {
              setPaymentError(verifyResult.error || 'We could not verify your payment. Contact us before paying again.');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setPaymentError('We could not verify your payment. Contact us before paying again.');
          } finally {
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (resp) => {
        console.error('Razorpay payment failed:', resp.error);
        setPaymentError(`Payment failed: ${resp.error?.description || resp.error?.reason || 'the transaction did not go through'}.`);
        setLoading(false);
      });
      razorpayInstance.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      setPaymentError(err.message || 'We could not start the payment.');
      setLoading(false);
    }
  };

  return (
    <div className="qs-page">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="qs-page__in">
        <Steps />
        <div className="qs-cab">
          <p className="qs-eyebrow">Checkout</p>
          <h1 className="qs-h1">Payment</h1>
        </div>

        {paymentError && (
          <div className="qs-alert" role="alert">
            <p>{paymentError}</p>
            <button type="button" onClick={() => setPaymentError('')} aria-label="Dismiss message">✕</button>
          </div>
        )}

        <div className="qs-dos">
          <div className="qs-form">
            <section className="qs-caja">
              <fieldset className="qs-opciones">
                <legend className="qs-caja__titulo">How would you like to pay?</legend>
                <label className="qs-opcion">
                  <input
                    type="radio"
                    name="payment_method"
                    value="razorpay"
                    checked={!isCod}
                    onChange={() => setSelectedMethod('razorpay')}
                  />
                  <span>
                    <b>Pay online · {formatINR(onlineTotals.total)}</b>
                    <small>UPI, cards and netbanking through Razorpay. <em>{Math.round(PREPAID_DISCOUNT * 100)}% off</em> your pieces.</small>
                  </span>
                </label>
                <label className="qs-opcion">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={isCod}
                    onChange={() => setSelectedMethod('cod')}
                  />
                  <span>
                    <b>Cash on delivery · {formatINR(codTotals.total)}</b>
                    <small>Pay by cash or UPI at your door. Bangalore only.</small>
                  </span>
                </label>
              </fieldset>
            </section>

            <button
              type="button"
              className="boton boton--lleno boton--ancho"
              onClick={handlePay}
              disabled={loading}
              aria-busy={loading || undefined}
            >
              {isCod ? `Place order · ${formatINR(totals.total)}` : `Pay ${formatINR(totals.total)}`}
            </button>
            <p className="qs-nota">
              {isCod
                ? 'You pay when your order arrives.'
                : 'A secure Razorpay window opens to complete the payment.'}
            </p>
          </div>

          <aside className="qs-pegajoso">
            <section className="qs-caja" aria-labelledby="pg-envio">
              <div className="qs-fila">
                <h2 className="qs-caja__titulo" id="pg-envio">Delivering to</h2>
                <Link href="/checkout" className="qs-quitar">Edit<span className="qs-sr"> delivery details</span></Link>
              </div>
              <dl className="qs-datos">
                <div><dt>Name</dt><dd>{orderDraft.customer_name}</dd></div>
                <div><dt>Address</dt><dd>{orderDraft.shipping_address}, Bangalore {orderDraft.pincode}</dd></div>
                <div><dt>Phone</dt><dd>+91 {orderDraft.customer_phone}</dd></div>
              </dl>
            </section>
            <section className="qs-caja" aria-labelledby="pg-resumen">
              <h2 className="qs-caja__titulo" id="pg-resumen">Your order</h2>
              <div className="qs-form">
                <BagLines items={orderDraft.items} />
                <BagTotals subtotal={subtotal} method={isCod ? 'cod' : 'online'} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
