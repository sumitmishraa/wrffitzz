'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = (item) => {
    // Add to cart with a default size (user can change on product page)
    addItem({ ...item, images: [item.image] }, 'M', item.category?.name || 'Default');
    removeItem(item.id);
  };

  return (
    <div className="wishlist-page">
      <div className="container">
        <h1 className="wishlist-page__title">Wishlist</h1>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty__icon">♡</div>
            <h2 className="cart-empty__title">Your wishlist is empty</h2>
            <p className="cart-empty__text">Save items you love to your wishlist and shop them anytime.</p>
            <Link href="/shop" className="btn btn--primary btn--lg">Explore Collection</Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
              {items.length} item{items.length > 1 ? 's' : ''} saved
            </p>
            <div className="product-grid stagger-children">
              {items.map(item => {
                const discount = item.compare_price
                  ? Math.round(((item.compare_price - item.price) / item.compare_price) * 100)
                  : 0;

                return (
                  <div key={item.id} className="product-card">
                    <Link href={`/product/${item.slug}`}>
                      <div className="product-card__image-wrap">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="product-card__image"
                          style={{ objectFit: 'cover' }}
                        />
                        {discount > 0 && (
                          <div className="product-card__badges">
                            <span className="product-card__badge product-card__badge--sale">{discount}% Off</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="product-card__info">
                      <span className="product-card__category">{item.category?.name || ''}</span>
                      <h3 className="product-card__name">{item.name}</h3>
                      <div className="product-card__pricing">
                        <span className="product-card__price">₹{item.price?.toLocaleString('en-IN')}</span>
                        {item.compare_price && (
                          <span className="product-card__compare-price">₹{item.compare_price?.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                        <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={() => handleMoveToCart(item)}>
                          Move to Bag
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => removeItem(item.id)} style={{ color: 'var(--color-error)' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
