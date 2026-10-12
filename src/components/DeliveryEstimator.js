'use client';
import { useState, useEffect } from 'react';

// Bangalore pincodes range
const BANGALORE_PINCODES = [];
for (let i = 560001; i <= 560117; i++) BANGALORE_PINCODES.push(String(i));
for (let i = 561101; i <= 561230; i++) BANGALORE_PINCODES.push(String(i));
for (let i = 562101; i <= 562165; i++) BANGALORE_PINCODES.push(String(i));

function isBangalorePincode(pin) {
  const cleanPin = pin.replace(/\D/g, '');
  if (cleanPin.length !== 6) return false;
  return BANGALORE_PINCODES.includes(cleanPin);
}

export default function DeliveryEstimator({ compact = false }) {
  const [pincode, setPincode] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);

  const calculateDeliveryDates = (cityName = '', pin = '') => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3);
    if (deliveryDate.getDay() === 0) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDelivery = deliveryDate.toLocaleDateString('en-IN', options);

    return {
      date: formattedDelivery,
      city: cityName,
      pincode: pin,
      codAvailable: true,
      freeShipping: true,
      dispatchTime: 'Ships in 24 Hours',
    };
  };

  useEffect(() => {
    const savedPin = localStorage.getItem('wrfitzz-user-pincode');
    const savedCity = localStorage.getItem('wrfitzz-user-city');

    if (savedPin) {
      setPincode(savedPin);
      setInputVal(savedPin);
      setLocationName(savedCity || '');
      if (isBangalorePincode(savedPin)) {
        setDeliveryInfo(calculateDeliveryDates(savedCity || '', savedPin));
        setComingSoon(false);
      } else {
        setComingSoon(true);
      }
    }
  }, []);

  const handleManualCheck = async (e) => {
    if (e) e.preventDefault();
    const cleanPin = inputVal.trim().replace(/\D/g, '');

    if (cleanPin.length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code');
      setComingSoon(false);
      return;
    }

    setError('');
    setComingSoon(false);
    setLoading(true);

    try {
      // Check if Bangalore first
      if (!isBangalorePincode(cleanPin)) {
        // Look up the city name still
        let resolvedCity = 'your city';
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
              const po = data[0].PostOffice[0];
              resolvedCity = `${po.District || po.Name}, ${po.State}`;
            }
          }
        } catch (err) { /* fail silently */ }

        setPincode(cleanPin);
        setLocationName(resolvedCity);
        setComingSoon(true);
        setDeliveryInfo(null);
        setIsEditing(false);
        localStorage.setItem('wrfitzz-user-pincode', cleanPin);
        localStorage.setItem('wrfitzz-user-city', resolvedCity);
        return;
      }

      // Valid Bangalore pincode
      let resolvedCity = 'Bangalore, Karnataka';
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            resolvedCity = `${po.District || po.Name}, ${po.State}`;
          }
        }
      } catch (err) { /* fail silently */ }

      setPincode(cleanPin);
      setLocationName(resolvedCity);
      const info = calculateDeliveryDates(resolvedCity, cleanPin);
      setDeliveryInfo(info);
      setComingSoon(false);
      setIsEditing(false);

      localStorage.setItem('wrfitzz-user-pincode', cleanPin);
      localStorage.setItem('wrfitzz-user-city', resolvedCity);
      localStorage.setItem('wrfitzz_pincode', cleanPin);
      localStorage.setItem('wrfitzz_delivery_info', JSON.stringify({ district: resolvedCity.split(',')[0], state: resolvedCity.split(',')[1]?.trim() || 'Karnataka' }));
    } catch (err) {
      setPincode(cleanPin);
      const info = calculateDeliveryDates('', cleanPin);
      setDeliveryInfo(info);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`delivery-widget ${compact ? 'delivery-widget--compact' : ''}`}>
      <div className="delivery-widget__header">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="delivery-widget__heading">DELIVERY & ESTIMATION</span>
      </div>

      {/* Coming Soon Banner */}
      {comingSoon && !isEditing && (
        <div className="delivery-widget__coming-soon">
          <div className="delivery-widget__coming-soon-icon">🚀</div>
          <div className="delivery-widget__coming-soon-content">
            <strong>We&apos;re coming soon to {locationName || 'your city'}!</strong>
            <p>Currently, wrfitzz delivers only within <strong>Bangalore</strong>. We&apos;re expanding fast — stay tuned!</p>
          </div>
          <button
            type="button"
            className="delivery-widget__change-btn"
            onClick={() => { setIsEditing(true); setInputVal(pincode); setComingSoon(false); }}
          >
            Change PIN
          </button>
        </div>
      )}

      {/* Delivery Available Result */}
      {deliveryInfo && !isEditing && !comingSoon && (
        <div className="delivery-widget__result">
          <div className="delivery-widget__date-card">
            <div className="delivery-widget__date-icon">📦</div>
            <div>
              <p className="delivery-widget__date-label">Estimated Delivery</p>
              <p className="delivery-widget__date-value">{deliveryInfo.date}</p>
            </div>
          </div>

          <p className="delivery-widget__location">
            Delivering to <strong>{locationName}</strong> ({deliveryInfo.pincode})
            <button
              type="button"
              className="delivery-widget__change-btn"
              onClick={() => { setIsEditing(true); setInputVal(pincode); }}
            >
              Change
            </button>
          </p>

          <div className="delivery-widget__badges">
            <span className="delivery-widget__badge delivery-widget__badge--success">✓ COD Available</span>
            <span className="delivery-widget__badge delivery-widget__badge--info">🚚 Free Delivery Over ₹1,999</span>
            <span className="delivery-widget__badge delivery-widget__badge--accent">⚡ {deliveryInfo.dispatchTime}</span>
          </div>
        </div>
      )}

      {/* Input Form */}
      {(!deliveryInfo && !comingSoon || isEditing) && (
        <form onSubmit={handleManualCheck} className="delivery-widget__form">
          <p className="delivery-widget__prompt">
            Enter your 6-digit PIN code to check delivery availability
          </p>

          <div className="delivery-widget__input-row">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter PIN code"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ''))}
              className="delivery-widget__input"
            />
            <button
              type="submit"
              className="delivery-widget__submit"
              disabled={loading || inputVal.length !== 6}
            >
              {loading ? '...' : 'CHECK'}
            </button>
          </div>

          {deliveryInfo && isEditing && (
            <button
              type="button"
              className="delivery-widget__cancel"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          )}

          {error && <p className="delivery-widget__error">{error}</p>}
        </form>
      )}
    </div>
  );
}
