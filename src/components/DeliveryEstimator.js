'use client';
import { useState, useEffect, useId } from 'react';
import { cleanPincode, isBangalorePincode, estimateDelivery } from '@/lib/delivery';
import { FREE_DELIVERY_OVER, formatINR } from '@/lib/pricing';

async function lookupCity(pin, fallback) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    if (!res.ok) return fallback;
    const data = await res.json();
    const po = data?.[0]?.Status === 'Success' ? data[0]?.PostOffice?.[0] : null;
    return po ? `${po.District || po.Name}, ${po.State}` : fallback;
  } catch {
    return fallback;
  }
}

export default function DeliveryEstimator() {
  const uid = useId();
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null); // { ok, pin, city, date }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const pin = localStorage.getItem('wrfitzz-user-pincode');
      const city = localStorage.getItem('wrfitzz-user-city') || '';
      if (pin) {
        setValue(pin);
        setResult({ ok: isBangalorePincode(pin), pin, city, date: estimateDelivery() });
      }
    } catch { /* storage unavailable */ }
  }, []);

  const check = async (e) => {
    e.preventDefault();
    const pin = cleanPincode(value);
    if (pin.length !== 6) {
      setError('Enter a 6-digit PIN code.');
      return;
    }
    setError('');
    setLoading(true);
    const ok = isBangalorePincode(pin);
    const city = await lookupCity(pin, ok ? 'Bangalore, Karnataka' : 'your area');
    setResult({ ok, pin, city, date: estimateDelivery() });
    setLoading(false);
    try {
      localStorage.setItem('wrfitzz-user-pincode', pin);
      localStorage.setItem('wrfitzz-user-city', city);
      if (ok) localStorage.setItem('wrfitzz_pincode', pin);
    } catch { /* storage unavailable */ }
  };

  return (
    <div className="qs-form">
      <form onSubmit={check} className="qs-field" noValidate>
        <label className="qs-label" htmlFor={`${uid}-pin`}>PIN code</label>
        <div className="qs-fila">
          <input
            id={`${uid}-pin`}
            className="qs-input"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder="560038"
            value={value}
            onChange={(e) => { setValue(cleanPincode(e.target.value)); setError(''); }}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${uid}-err` : undefined}
          />
          <button type="submit" className="boton" aria-busy={loading || undefined} disabled={loading}>
            Check
          </button>
        </div>
        {error && <p className="qs-error-text" id={`${uid}-err`}>{error}</p>}
      </form>
      <div aria-live="polite">
        {result && !loading && (
          result.ok ? (
            <p className="qs-hint">
              Delivering to <b>{result.city}</b> ({result.pin}) by <b>{result.date}</b>. Cash on delivery available,
              free delivery over {formatINR(FREE_DELIVERY_OVER)}.
            </p>
          ) : (
            <p className="qs-hint">
              We deliver inside Bangalore only for now, so we can&apos;t reach {result.city} ({result.pin}) yet.
            </p>
          )
        )}
      </div>
    </div>
  );
}
