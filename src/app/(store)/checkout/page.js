'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { computeTotals, PREPAID_DISCOUNT } from '@/lib/pricing';
import { cleanPincode, isBangalorePincode } from '@/lib/delivery';
import { BagLines, BagTotals } from '@/components/quietstyle/BagSummary';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.customer_name.trim()) errors.customer_name = 'Enter your full name.';
  if (!EMAIL_RE.test(form.customer_email.trim())) errors.customer_email = 'Enter an email address like name@example.com.';
  if (form.customer_phone.replace(/\D/g, '').length !== 10) errors.customer_phone = 'Enter a 10-digit mobile number.';
  if (!form.shipping_address.trim()) errors.shipping_address = 'Enter your street address and flat or house number.';
  const pin = cleanPincode(form.pincode);
  if (pin.length !== 6) errors.pincode = 'Enter a 6-digit PIN code.';
  else if (!isBangalorePincode(pin)) errors.pincode = 'We deliver inside Bangalore only for now. Enter a Bangalore PIN code, such as 560038.';
  return errors;
}

const ORDER = ['customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'pincode'];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, loaded } = useCart();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);

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
      setForm((prev) => ({
        ...prev,
        customer_phone: prev.customer_phone || cleanPhone,
        customer_name: prev.customer_name || (user.name !== 'wrfitzz Member' ? user.name || '' : ''),
        customer_email: prev.customer_email || user.email || '',
      }));
    }
  }, [user]);

  // Auto-load saved address
  useEffect(() => {
    try {
      const savedAddressStr = localStorage.getItem('wrfitzz_saved_address') || localStorage.getItem('wrfitzz-saved-address');
      if (savedAddressStr) {
        const addr = JSON.parse(savedAddressStr);
        setForm((prev) => ({
          ...prev,
          shipping_address: prev.shipping_address || addr.address || addr.street || '',
          pincode: prev.pincode || addr.pincode || '',
          customer_phone: prev.customer_phone || addr.phone || '',
          customer_name: prev.customer_name || addr.name || '',
        }));
      } else {
        const savedPin = localStorage.getItem('wrfitzz_pincode');
        if (savedPin) setForm((prev) => ({ ...prev, pincode: savedPin }));
      }
    } catch (e) {
      console.warn('Could not read saved checkout info', e);
    }
  }, []);

  const errors = validate(form);
  const show = (name) => (submitted ? errors[name] : undefined);
  const pin = cleanPincode(form.pincode);
  const pinOk = isBangalorePincode(pin);
  const pinError = submitted || pin.length === 6 ? errors.pincode : undefined;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = name === 'pincode' ? cleanPincode(value) : name === 'customer_phone' ? value.replace(/\D/g, '') : value;
    setForm((prev) => ({ ...prev, [name]: next }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitted(true);

    const firstBad = ORDER.find((k) => errors[k]);
    if (firstBad) {
      formRef.current?.querySelector(`#${firstBad}`)?.focus();
      return;
    }

    setLoading(true);
    const totals = computeTotals(totalPrice, { prepaid: true });
    const pendingOrder = {
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim(),
      customer_phone: form.customer_phone,
      shipping_address: form.shipping_address.trim(),
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: pin,
      subtotal: totals.subtotal,
      shipping: totals.delivery,
      total_amount: totals.total,
      items: items.map((item) => ({
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
        address: pendingOrder.shipping_address,
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: pin,
        phone: form.customer_phone,
        name: pendingOrder.customer_name,
      }));
      if (user?.phone) {
        updateProfile({ name: pendingOrder.customer_name, email: pendingOrder.customer_email });
      }
    } catch (err) {
      console.warn('LocalStorage save error', err);
    }

    router.push('/payment');
  };

  const fieldProps = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: handleChange,
    className: 'qs-input',
    'aria-invalid': show(name) ? 'true' : undefined,
    'aria-describedby': show(name) ? `${name}-err` : undefined,
  });

  const Steps = (
    <ol className="qs-pasos" aria-label="Checkout steps">
      <li><b>1</b><Link href="/cart">Bag</Link></li>
      <li aria-current="step"><b>2</b>Details</li>
      <li><b>3</b>Payment</li>
    </ol>
  );

  if (!loaded) {
    return (
      <div className="qs-page" aria-busy="true">
        <div className="qs-page__in">
          {Steps}
          <p className="qs-sub">Loading your bag…</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="qs-page">
        <div className="qs-page__in">
          {Steps}
          <div className="qs-empty">
            <h1 className="qs-h1">Your bag is empty</h1>
            <p>Add a piece or two before heading to checkout.</p>
            <Link href="/shop" className="boton boton--lleno">Shop all pieces</Link>
          </div>
        </div>
      </div>
    );
  }

  const errorCount = submitted ? Object.keys(errors).length : 0;

  return (
    <div className="qs-page">
      <div className="qs-page__in">
        {Steps}
        <div className="qs-cab">
          <p className="qs-eyebrow">Checkout</p>
          <h1 className="qs-h1">Delivery details</h1>
          <p className="qs-sub">We deliver across Bangalore, dispatched within 24 hours.</p>
        </div>

        <div className="qs-dos">
          <form className="qs-form" onSubmit={handleSubmit} noValidate ref={formRef}>
            {errorCount > 0 && (
              <div className="qs-alert" role="alert">
                <p>{errorCount === 1 ? 'One field needs attention.' : `${errorCount} fields need attention.`} Check the messages below.</p>
              </div>
            )}

            <section className="qs-caja" aria-labelledby="co-contacto">
              <h2 className="qs-caja__titulo" id="co-contacto">
                Contact
                <small>
                  {user
                    ? `Signed in as ${user.phone || user.email}.`
                    : 'Order updates and delivery calls go here.'}
                </small>
              </h2>
              <div className="qs-grid">
                <div className="qs-field qs-field--full">
                  <label className="qs-label" htmlFor="customer_name">Full name</label>
                  <input {...fieldProps('customer_name')} type="text" autoComplete="name" />
                  {show('customer_name') && <p className="qs-error-text" id="customer_name-err">{errors.customer_name}</p>}
                </div>
                <div className="qs-field">
                  <label className="qs-label" htmlFor="customer_email">Email</label>
                  <input {...fieldProps('customer_email')} type="email" autoComplete="email" placeholder="name@example.com" />
                  {show('customer_email') && <p className="qs-error-text" id="customer_email-err">{errors.customer_email}</p>}
                </div>
                <div className="qs-field">
                  <label className="qs-label" htmlFor="customer_phone">Mobile number</label>
                  <div className="qs-input-grupo">
                    <span aria-hidden="true">+91</span>
                    <input {...fieldProps('customer_phone')} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="98765 43210" />
                  </div>
                  {show('customer_phone') && <p className="qs-error-text" id="customer_phone-err">{errors.customer_phone}</p>}
                </div>
              </div>
            </section>

            <section className="qs-caja" aria-labelledby="co-direccion">
              <h2 className="qs-caja__titulo" id="co-direccion">
                Address
                <small>Bangalore only for now.</small>
              </h2>
              <div className="qs-grid">
                <div className="qs-field qs-field--full">
                  <label className="qs-label" htmlFor="shipping_address">Street address, flat or house number</label>
                  <input {...fieldProps('shipping_address')} type="text" autoComplete="street-address" />
                  {show('shipping_address') && <p className="qs-error-text" id="shipping_address-err">{errors.shipping_address}</p>}
                </div>
                <div className="qs-field">
                  <label className="qs-label" htmlFor="pincode">PIN code</label>
                  <input
                    {...fieldProps('pincode')}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    placeholder="560038"
                    aria-invalid={pinError ? 'true' : undefined}
                    aria-describedby={pinError ? 'pincode-err' : pinOk ? 'pincode-ok' : undefined}
                    data-ok={pinOk || undefined}
                  />
                  {pinError && <p className="qs-error-text" id="pincode-err">{pinError}</p>}
                  {!pinError && pinOk && <p className="qs-ok-text" id="pincode-ok">We deliver here.</p>}
                </div>
                <div className="qs-field">
                  <label className="qs-label" htmlFor="city">City</label>
                  <input id="city" className="qs-input" type="text" value="Bangalore, Karnataka" readOnly />
                </div>
              </div>
            </section>

            <button type="submit" className="boton boton--lleno boton--ancho" aria-busy={loading || undefined} disabled={loading}>
              Continue to payment
            </button>
            <p className="qs-nota">
              You choose how to pay on the next step: online, with {Math.round(PREPAID_DISCOUNT * 100)}% off, or cash on delivery.
            </p>
          </form>

          <aside className="qs-caja qs-pegajoso" aria-labelledby="co-resumen">
            <h2 className="qs-caja__titulo" id="co-resumen">Your order</h2>
            <div className="qs-form">
              <BagLines items={items} />
              <BagTotals subtotal={totalPrice} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
