'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/quietstyle/ProductCard';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    let alive = true;
    getProducts().then((list) => { if (alive) setCatalog(list); });
    return () => { alive = false; };
  }, []);

  // Saved items keep only a summary; show the live product when it still exists.
  const pieces = (catalog ? items : []).map((saved) => {
    const live = catalog.find((p) => p.id === saved.id);
    return live || { ...saved, images: saved.image ? [saved.image] : [], in_stock: false };
  });

  return (
    <div className="qs-page qs-page--blanca">
      <div className="qs-page__in">
        <nav aria-label="Breadcrumb">
          <ol className="qs-migas">
            <li><Link href="/">Home</Link></li>
            <li><span aria-current="page">Wishlist</span></li>
          </ol>
        </nav>
        <div className="qs-cab">
          <p className="qs-eyebrow">Saved for later</p>
          <h1 className="qs-h1">Wishlist</h1>
          {items.length > 0 && (
            <p className="qs-sub">{items.length} {items.length === 1 ? 'piece' : 'pieces'} saved on this device.</p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="qs-empty">
            <h2>Nothing saved yet</h2>
            <p>Tap “Save to wishlist” on any piece to keep it here.</p>
            <Link href="/shop" className="boton boton--lleno">Shop all pieces</Link>
          </div>
        ) : !catalog ? (
          <p className="qs-sub" aria-busy="true">Loading your pieces…</p>
        ) : (
          <ul className="qs-grilla">
            {pieces.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} onRemove={() => removeItem(p.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
