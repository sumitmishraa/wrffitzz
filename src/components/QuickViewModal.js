'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import DeliveryEstimator from './DeliveryEstimator';

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (product) {
      const defaultColor = product.colors?.[0]?.name || product.colors?.[0] || 'Standard';
      setSelectedColor(defaultColor);
      setSelectedSize(product.sizes?.[1] || product.sizes?.[0] || 'M');
      setQuantity(1);
      const initialImg = product.colors?.[0]?.image || product.images?.[0] || '';
      setActiveImage(initialImg);
    }
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setAddedNotice(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const inWishlist = isInWishlist(product.id);
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;
  const emiPerMonth = Math.round(product.price / 3);

  const handleColorChange = (colorObj) => {
    const colorName = typeof colorObj === 'string' ? colorObj : colorObj.name;
    setSelectedColor(colorName);
    if (colorObj.image) {
      setActiveImage(colorObj.image);
    }
  };

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedColor, quantity);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 900);
  };

  return (
    <div className="quickview-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="quickview-modal__container" onClick={e => e.stopPropagation()}>
        <button
          className="quickview-modal__close"
          onClick={onClose}
          aria-label="Close Quick View"
          type="button"
        >
          ✕
        </button>

        <div className="quickview-modal__body">
          {/* Product Gallery */}
          <div className="quickview-modal__gallery">
            <div className="quickview-modal__main-image">
              <Image
                src={activeImage || product.images?.[0] || '/images/products/geometric-shirt-front.jpg'}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                style={{ objectFit: 'cover' }}
                priority
              />
              {discount > 0 && (
                <span className="product-badge product-badge--sale">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images && product.images.length > 1 && (
              <div className="quickview-modal__thumbs">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`quickview-modal__thumb ${activeImage === img ? 'quickview-modal__thumb--active' : ''}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <Image src={img} alt={`${product.name} thumbnail ${idx}`} fill style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="quickview-modal__details">
            <div className="quickview-modal__category-row">
              <span className="quickview-modal__category">{product.category?.name || 'Streetwear'}</span>
              <span className="quickview-modal__blr-tag">⚡ Bangalore Delivery</span>
            </div>

            <h2 className="quickview-modal__title">{product.name}</h2>

            {/* Pricing */}
            <div className="quickview-modal__price-wrap">
              <span className="quickview-modal__price">₹{product.price.toLocaleString('en-IN')}</span>
              {product.compare_price && (
                <s className="quickview-modal__compare">₹{product.compare_price.toLocaleString('en-IN')}</s>
              )}
              {discount > 0 && (
                <span className="quickview-modal__discount">{discount}% OFF</span>
              )}
            </div>

            {/* EMI Badge */}
            <div className="snapmint-emi-badge">
              <span>or <strong className="snapmint-amount">₹{emiPerMonth}</strong>/Month on 3 easy EMIs</span>
            </div>

            {/* Color selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="quickview-modal__section">
                <div className="section-label">
                  <span>Color:</span>
                  <strong>{selectedColor}</strong>
                </div>
                <div className="quickview-modal__colors">
                  {product.colors.map((c, idx) => {
                    const name = typeof c === 'string' ? c : c.name;
                    const hex = typeof c === 'string' ? '#000000' : c.hex || '#000000';
                    const isSelected = selectedColor === name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`color-swatch-btn ${isSelected ? 'color-swatch-btn--selected' : ''}`}
                        onClick={() => handleColorChange(c)}
                        title={name}
                      >
                        <span
                          className="color-swatch-btn__dot"
                          style={{
                            backgroundColor: hex,
                            border: hex === '#ffffff' ? '1px solid #ccc' : 'none'
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="quickview-modal__section">
                <div className="section-label">
                  <span>Size:</span>
                  <strong>{selectedSize}</strong>
                </div>
                <div className="quickview-modal__sizes">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`size-pill ${selectedSize === size ? 'size-pill--selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="quickview-modal__actions">
              <div className="quantity-counter">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="quantity-btn"
                  disabled={quantity <= 1}
                >−</button>
                <span className="quantity-val">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="quantity-btn"
                >+</button>
              </div>

              <button
                type="button"
                className={`btn btn--primary quickview-modal__atc ${addedNotice ? 'quickview-modal__atc--added' : ''}`}
                onClick={handleAddToCart}
              >
                {addedNotice ? '✓ ADDED TO BAG' : 'ADD TO BAG'}
              </button>

              <button
                type="button"
                className={`quickview-modal__wishlist-btn ${inWishlist ? 'active' : ''}`}
                onClick={() => toggleItem(product)}
                aria-label="Wishlist"
              >
                <svg width="20" height="20" fill={inWishlist ? '#B55941' : 'none'} stroke={inWishlist ? '#B55941' : 'currentColor'} strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Delivery Estimation Widget inside modal */}
            <DeliveryEstimator compact={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
