'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import QuickViewModal from './QuickViewModal';

export default function ProductCard({ product }) {
  const { isInWishlist, toggleItem } = useWishlist();
  const { addItem } = useCart();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickAddActive, setQuickAddActive] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;
  const emiPerMonth = Math.round(product.price / 3);

  // Active image based on selected swatch
  const activeColor = product.colors?.[selectedColorIdx];
  const activeImage =
    activeColor?.image ||
    product.images?.[selectedColorIdx] ||
    product.images?.[0] ||
    '/images/products/geometric-shirt-front.jpg';

  const handleQuickAdd = (e, size = 'M') => {
    e.preventDefault();
    e.stopPropagation();
    const colorName = typeof activeColor === 'string' ? activeColor : activeColor?.name || 'Standard';
    addItem(product, size, colorName, 1);
    setJustAdded(true);
    setQuickAddActive(false);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <>
      <div className="product-card">
        {/* Image Box */}
        <div className="product-card__image-wrap">
          <Link href={`/product/${product.slug}`} className="product-card__image-link">
            <div className="product-card__img-container">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="product-card__image"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </Link>

          {/* Badges */}
          <div className="product-card__badges">
            {discount > 0 && (
              <span className="product-badge product-badge--sale">
                {discount}% OFF
              </span>
            )}
            {product.is_new && !discount && (
              <span className="product-badge product-badge--new">
                NEW
              </span>
            )}
          </div>

          {/* Floating Action Buttons */}
          <div className="product-card__actions">
            {/* Wishlist Button */}
            <button
              type="button"
              className={`product-card__action-btn ${inWishlist ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleItem(product);
              }}
              title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label="Wishlist"
            >
              <svg width="18" height="18" fill={inWishlist ? '#C1121F' : 'none'} stroke={inWishlist ? '#C1121F' : 'currentColor'} strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="action-tooltip">{inWishlist ? 'In Wishlist' : 'Wishlist'}</span>
            </button>

            {/* Quick Add Button */}
            <button
              type="button"
              className={`product-card__action-btn ${justAdded ? 'active-success' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickAddActive(prev => !prev);
              }}
              title="Quick Add"
              aria-label="Quick Add"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="action-tooltip">{justAdded ? 'Added!' : 'Quick Add'}</span>
            </button>

            {/* Quick View Button */}
            <button
              type="button"
              className="product-card__action-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              title="Quick View"
              aria-label="Quick View"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="action-tooltip">Quick View</span>
            </button>
          </div>

          {/* Quick Size Dropdown Selector on Quick Add Click */}
          {quickAddActive && (
            <div className="product-card__quick-sizes" onClick={e => e.stopPropagation()}>
              <span className="quick-sizes__label">Select Size:</span>
              <div className="quick-sizes__options">
                {(product.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map(size => (
                  <button
                    key={size}
                    type="button"
                    className="quick-size-btn"
                    onClick={(e) => handleQuickAdd(e, size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="product-card__info">
          <Link href={`/product/${product.slug}`} className="product-card__name-link">
            <h3 className="product-card__name">{product.name}</h3>
          </Link>

          {/* Pricing */}
          <div className="product-card__pricing">
            <span className="product-card__price">₹{product.price.toLocaleString('en-IN')}</span>
            {product.compare_price && (
              <s className="product-card__compare-price">₹{product.compare_price.toLocaleString('en-IN')}</s>
            )}
          </div>

          {/* Snapmint EMI */}
          <div
            className="product-card__emi"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewOpen(true);
            }}
          >
            <span>or <strong className="emi-highlight">₹{emiPerMonth}</strong>/Month</span>
            <span className="emi-link">Buy on EMI &gt;</span>
          </div>

          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="product-card__swatches">
              {product.colors.map((c, idx) => {
                const name = typeof c === 'string' ? c : c.name;
                const hex = typeof c === 'string' ? '#000000' : c.hex || '#000000';
                const isSelected = selectedColorIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`swatch-circle ${isSelected ? 'swatch-circle--active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedColorIdx(idx);
                    }}
                    onMouseEnter={() => setSelectedColorIdx(idx)}
                    title={name}
                    aria-label={name}
                  >
                    <span
                      className="swatch-circle__color"
                      style={{
                        backgroundColor: hex,
                        border: hex.toLowerCase() === '#ffffff' ? '1px solid #d0d0d0' : 'none'
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
}
