'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

import DeliveryEstimator from './DeliveryEstimator';

export default function ProductDetailClient({ product }) {
  const initialColorName = typeof product.colors?.[0] === 'string'
    ? product.colors[0]
    : product.colors?.[0]?.name || '';

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState(initialColorName);
  const [customActiveImage, setCustomActiveImage] = useState(
    product.colors?.[0]?.image || product.images?.[0] || ''
  );
  const [activeTab, setActiveTab] = useState('details');
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const emiPerMonth = Math.round(product.price / 3);

  const handleColorSelect = (c) => {
    const name = typeof c === 'string' ? c : c.name;
    setSelectedColor(name);
    if (c.image) {
      setCustomActiveImage(c.image);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    addItem(product, selectedSize, selectedColor);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(product.rating || 4.5));

  const displayImage = customActiveImage || product.images?.[selectedImage] || '/images/products/geometric-shirt-front.jpg';

  return (
    <div className="pdp__inner">
      {/* Gallery */}
      <div className="pdp__gallery">
        <div className="pdp__thumbs">
          {product.images?.map((img, i) => (
            <Image
              key={i}
              src={img}
              alt={`${product.name} view ${i + 1}`}
              width={80}
              height={100}
              className={`pdp__thumb ${displayImage === img ? 'pdp__thumb--active' : ''}`}
              onClick={() => { setSelectedImage(i); setCustomActiveImage(img); }}
              style={{ objectFit: 'cover' }}
            />
          ))}
        </div>
        <div className="pdp__main-image">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            sizes="50vw"
            priority
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="pdp__info">
        <div className="pdp__breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/shop">Shop</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/shop/${product.category.slug}`}>{product.category.name}</Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--color-text-primary)' }}>{product.name}</span>
        </div>

        {product.is_new && (
          <span style={{
            display: 'inline-block',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            background: 'var(--color-obsidian)',
            color: 'var(--color-ivory)',
            alignSelf: 'flex-start'
          }}>
            New Arrival
          </span>
        )}

        <h1 className="pdp__title">{product.name}</h1>

        <div className="pdp__rating">
          <div className="pdp__stars">
            {stars.map((filled, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span>{product.rating} ({product.review_count} reviews)</span>
        </div>

        <div className="pdp__pricing">
          <span className="pdp__price">₹{product.price?.toLocaleString('en-IN')}</span>
          {product.compare_price && (
            <span className="pdp__compare-price">₹{product.compare_price?.toLocaleString('en-IN')}</span>
          )}
          {discount > 0 && (
            <span className="pdp__discount-badge">{discount}% OFF</span>
          )}
        </div>

        {/* Snapmint EMI Widget */}
        <div className="snapmint-emi-badge" style={{ margin: '8px 0 16px' }}>
          <span>or <span className="snapmint-amount">₹{emiPerMonth}</span>/Month</span>
          <span className="snapmint-link">Buy on EMI &gt;</span>
        </div>

        <p className="pdp__description">{product.description}</p>

        <div className="pdp__options">
          {/* Color Selection */}
          {product.colors?.length > 0 && (
            <div>
              <p className="pdp__option-label">Color: <strong>{selectedColor}</strong></p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {product.colors.map((c, idx) => {
                  const name = typeof c === 'string' ? c : c.name;
                  const hex = typeof c === 'string' ? '#000000' : c.hex || '#000000';
                  const isSelected = selectedColor === name;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleColorSelect(c)}
                      className={`color-swatch-btn ${isSelected ? 'color-swatch-btn--selected' : ''}`}
                      title={name}
                    >
                      <span
                        className="color-swatch-btn__dot"
                        style={{
                          backgroundColor: hex,
                          border: hex.toLowerCase() === '#ffffff' ? '1px solid #ccc' : 'none'
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div>
            <p className="pdp__option-label">Size: <span>{selectedSize || 'Select a size'}</span></p>
            <div className="pdp__sizes">
              {product.sizes?.map(size => (
                <button
                  key={size}
                  className={`pdp__size-btn ${selectedSize === size ? 'pdp__size-btn--active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pdp__actions">
          <button
            className="btn btn--primary btn--lg pdp__add-to-cart"
            onClick={handleAddToCart}
            style={{ flex: 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {addedToCart ? 'Added to Bag!' : 'Add to Bag'}
          </button>
          <button
            className={`pdp__wishlist-btn ${inWishlist ? 'pdp__wishlist-btn--active' : ''}`}
            onClick={() => toggleItem(product)}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Live PIN Code Delivery Estimator */}
        <DeliveryEstimator />

        {/* Trust Badges */}
        <div className="pdp__trust-badges">
          <div className="pdp__trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            Free Shipping
          </div>
          <div className="pdp__trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Easy Returns
          </div>
          <div className="pdp__trust-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secure Payment
          </div>
        </div>

        {/* Tabs */}
        <div className="pdp__details-tabs">
          <div className="pdp__tab-list">
            {['details', 'material', 'care'].map(tab => (
              <button
                key={tab}
                className={`pdp__tab ${activeTab === tab ? 'pdp__tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'details' ? 'Details' : tab === 'material' ? 'Material' : 'Care Instructions'}
              </button>
            ))}
          </div>
          <div className="pdp__tab-content">
            {activeTab === 'details' && (
              <div className="pdp__features">
                <p>{product.description}</p>
                <div className="pdp__feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Premium quality fabric
                </div>
                <div className="pdp__feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Comfortable fit for all-day wear
                </div>
                <div className="pdp__feature">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Designed in India
                </div>
              </div>
            )}
            {activeTab === 'material' && <p>{product.material || 'Premium quality fabric'}</p>}
            {activeTab === 'care' && <p>{product.care_instructions || 'Machine wash cold. Iron on low heat.'}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
