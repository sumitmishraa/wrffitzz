'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  const shippingCost = totalPrice >= 2999 ? 0 : 199;
  const finalTotal = totalPrice + shippingCost;

  return (
    <div className="bag-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="bag-breadcrumb">
          <Link href="/">Home</Link>
          <span className="bag-breadcrumb__sep">›</span>
          <span className="bag-breadcrumb__current">Shopping Bag</span>
        </div>

        <div className="bag-page__header">
          <h1 className="bag-page__title">Shopping Bag</h1>
          {items.length > 0 && (
            <span className="bag-page__count">{items.length} item{items.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bag-empty">
            <div className="bag-empty__icon">
              <svg width="80" height="80" fill="none" stroke="#ccc" strokeWidth="1.2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2 className="bag-empty__title">Your bag is empty</h2>
            <p className="bag-empty__text">Looks like you haven&apos;t added anything to your bag yet.</p>
            <Link href="/shop" className="btn btn--primary btn--lg">Start Shopping</Link>
          </div>
        ) : (
          <div className="bag-page__layout">
            {/* Left: Items */}
            <div className="bag-items">
              <div className="bag-items__header">
                <span className="bag-items__label">Product</span>
                <button className="bag-items__clear" onClick={clearCart}>Clear All</button>
              </div>

              {items.map(item => (
                <div key={item.key} className="bag-item">
                  <div className="bag-item__image-box">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={140}
                      height={175}
                      className="bag-item__image"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="bag-item__details">
                    <Link href={`/product/${item.slug}`} className="bag-item__name">{item.name}</Link>
                    <div className="bag-item__meta-tags">
                      <span className="bag-item__meta-tag">Size: <strong>{item.size}</strong></span>
                      <span className="bag-item__meta-tag">Color: <strong>{item.color}</strong></span>
                    </div>
                    <p className="bag-item__unit-price">₹{item.price.toLocaleString('en-IN')} each</p>
                    <div className="bag-item__actions">
                      <div className="bag-item__quantity">
                        <button
                          className="bag-item__qty-btn"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >−</button>
                        <span className="bag-item__qty-value">{item.quantity}</span>
                        <button
                          className="bag-item__qty-btn"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        >+</button>
                      </div>
                      <button className="bag-item__remove" onClick={() => removeItem(item.key)}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="bag-item__total">
                    <span className="bag-item__total-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary */}
            <div className="bag-summary">
              <div className="bag-summary__inner">
                <h2 className="bag-summary__title">Order Summary</h2>

                <div className="bag-summary__row">
                  <span>Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="bag-summary__row">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'bag-summary__free' : ''}>
                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                  </span>
                </div>
                <div className="bag-summary__row">
                  <span>Taxes</span>
                  <span className="bag-summary__muted">Included</span>
                </div>

                {shippingCost > 0 && (
                  <div className="bag-summary__free-ship-note">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Add ₹{(2999 - totalPrice).toLocaleString('en-IN')} more for free delivery
                  </div>
                )}

                <div className="bag-summary__divider" />

                <div className="bag-summary__total">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>

                <Link href="/checkout" className="bag-summary__checkout-btn">
                  Proceed to Checkout
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>

                <Link href="/shop" className="bag-summary__continue">
                  ← Continue Shopping
                </Link>

                <div className="bag-summary__trust">
                  <div className="bag-summary__trust-item">
                    <span>🔒</span> Secure Checkout
                  </div>
                  <div className="bag-summary__trust-item">
                    <span>🚚</span> Free Delivery over ₹2,999
                  </div>
                  <div className="bag-summary__trust-item">
                    <span>↩️</span> 15-Day Easy Returns
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
