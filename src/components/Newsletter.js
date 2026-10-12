'use client';
import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section className="vip-newsletter">
      <div className="container text-center">
        <span className="vip-newsletter__badge">
          <span className="vip-newsletter__dot" />
          WRFITZZ VIP CLUB
        </span>
        <h2 className="vip-newsletter__title">Get Early Access to New Drops</h2>
        <p className="vip-newsletter__subtitle">
          Sign up for 15% off your first purchase and exclusive priority access to limited-edition streetwear capsules.
        </p>

        {subscribed ? (
          <div className="newsletter-success-msg">
            🎉 Welcome to wrfitzz VIP club! Your 15% off welcome code has been activated.
          </div>
        ) : (
          <form className="vip-newsletter__form" onSubmit={handleSubmit}>
            <div className="vip-newsletter__input-wrap">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="vip-newsletter__mail-icon">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                placeholder="Enter your email address..."
                className="vip-newsletter__input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="vip-newsletter__btn">
              <span>SUBSCRIBE</span>
              <span className="arrow">→</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
