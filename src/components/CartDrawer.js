'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const FREE_SHIPPING_THRESHOLD = 2999;
  const progressPercent = Math.min(100, Math.round((totalPrice / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);

  const applyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.trim().toUpperCase();
    if (code === 'PREPAID10') {
      const disc = Math.round(totalPrice * 0.10);
      setDiscountAmount(disc);
      setCouponSuccess('10% Prepaid Discount Applied!');
    } else if (code === 'WRF500' && totalPrice >= 2500) {
      setDiscountAmount(500);
      setCouponSuccess('₹500 Welcome Discount Applied!');
    } else {
      setCouponError('Invalid coupon code. Try PREPAID10');
      setDiscountAmount(0);
    }
  };

  const shippingCost = totalPrice >= FREE_SHIPPING_THRESHOLD || totalPrice === 0 ? 0 : 199;
  const finalTotal = Math.max(0, totalPrice - discountAmount) + shippingCost;

  return (
    <>
      <div
        className={`cart-drawer__backdrop ${isOpen ? 'cart-drawer__backdrop--open' : ''}`}
        onClick={() => setIsOpen(false)}
      />
      <aside className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}>
        {/* Header */}
        <div className="cart-drawer__header">
          <div className="cart-drawer__header-left">
            <h2 className="cart-drawer__title">Your Bag</h2>
            <span className="cart-drawer__count-badge">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
          <button
            className="cart-drawer__close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Bangalore City Announcement Bar */}
        <div className="cart-drawer__city-banner">
          <span className="city-pulse"></span>
          <span>Delivering across <strong>Bangalore</strong> · Same-day dispatch</span>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="cart-shipping-bar">
          <div className="cart-shipping-bar__message">
            {remainingForFree === 0 ? (
              <span>🎉 You unlocked <strong>FREE Bangalore Shipping</strong>!</span>
            ) : (
              <span>Add <strong>₹{remainingForFree.toLocaleString('en-IN')}</strong> more for <strong>FREE Delivery</strong></span>
            )}
          </div>
          <div className="cart-shipping-bar__track">
            <div
              className="cart-shipping-bar__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-icon">🛍️</span>
              <h3 className="cart-empty-title">Your bag is empty</h3>
              <p className="cart-empty-desc">Discover our latest streetwear drop and find your fit.</p>
              <Link
                href="/shop"
                className="btn btn--primary"
                onClick={() => setIsOpen(false)}
              >
                Shop New Arrivals
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.key} className="cart-drawer-item">
                {/* Product image in clean bordered box */}
                <div className="cart-drawer-item__img-box">
                  <Image
                    src={item.image || '/images/products/geometric-shirt-front.jpg'}
                    alt={item.name}
                    width={80}
                    height={100}
                    className="cart-drawer-item__img"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* Product Details */}
                <div className="cart-drawer-item__info">
                  <Link
                    href={`/product/${item.slug}`}
                    className="cart-drawer-item__title"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>

                  {/* Size and Color tags clearly visible */}
                  <div className="cart-drawer-item__meta-tags">
                    <span className="meta-tag">Size: <strong>{item.size}</strong></span>
                    <span className="meta-tag">Color: <strong>{item.color}</strong></span>
                  </div>

                  <div className="cart-drawer-item__price">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    {item.quantity > 1 && (
                      <span className="unit-price"> (₹{item.price.toLocaleString('en-IN')} each)</span>
                    )}
                  </div>

                  {/* Quantity and Remove */}
                  <div className="cart-drawer-item__actions">
                    <div className="cart-drawer-item__qty-ctrl">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      >+</button>
                    </div>

                    <button
                      type="button"
                      className="cart-drawer-item__remove-btn"
                      onClick={() => removeItem(item.key)}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Clean Order Summary */}
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            {/* Promo Code Box */}
            <form onSubmit={applyCoupon} className="cart-coupon-form">
              <input
                type="text"
                placeholder="Coupon code (e.g. PREPAID10)"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                className="cart-coupon-input"
              />
              <button type="submit" className="cart-coupon-btn">
                Apply
              </button>
            </form>
            {couponSuccess && <p className="coupon-feedback success">✓ {couponSuccess}</p>}
            {couponError && <p className="coupon-feedback error">✕ {couponError}</p>}

            {/* Calculations */}
            <div className="cart-drawer-summary">
              <div className="summary-row">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="summary-row discount">
                  <span>Special Discount</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Bangalore Shipping</span>
                <span className={shippingCost === 0 ? 'free-tag' : ''}>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </span>
              </div>
              <div className="summary-row total">
                <span>Estimated Total</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="cart-drawer__buttons">
              <Link
                href="/checkout"
                className="btn btn--primary btn--full btn--lg cart-checkout-cta"
                onClick={() => setIsOpen(false)}
              >
                PROCEED TO CHECKOUT · ₹{finalTotal.toLocaleString('en-IN')}
              </Link>
              <Link
                href="/cart"
                className="btn btn--outline btn--full view-bag-link"
                onClick={() => setIsOpen(false)}
              >
                VIEW FULL SHOPPING BAG
              </Link>
            </div>

            {/* Trust badge */}
            <div className="cart-drawer__trust-badges">
              <span>🔒 100% Secure Checkout</span>
              <span>⚡ Bangalore Delivery</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
