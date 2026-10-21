'use client';
import { useState, useRef, useEffect, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/pricing';

const SIZES_ATTR = '(max-width: 860px) 50vw, (max-width: 1000px) 33vw, 25vw';

export default function ProductCard({ product, priority = false, onRemove, index = 0 }) {
  const { addItem } = useCart();
  const [sizesOpen, setSizesOpen] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const addRef = useRef(null);
  const listRef = useRef(null);
  const cycleRef = useRef(0);
  const uid = useId();

  useEffect(() => () => clearInterval(cycleRef.current), []);

  // Reference HOVER-CICLO: with the pointer resting on the card, front and
  // back take turns every 1.6s (mouse devices only, not with reduced motion).
  const startCycle = () => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearInterval(cycleRef.current);
    setShowBack(true);
    cycleRef.current = setInterval(() => setShowBack((v) => !v), 1600);
  };
  const stopCycle = () => {
    clearInterval(cycleRef.current);
    setShowBack(false);
  };

  const href = `/product/${product.slug}`;
  const front = product.images?.[0] || '';
  const back = product.images?.[1];
  const color = product.colors?.[0]?.name || 'Standard';
  const sizes = product.sizes?.length ? product.sizes : ['One Size'];
  const soldOut = product.in_stock === false;

  useEffect(() => {
    if (sizesOpen) listRef.current?.querySelector('.qs-rapido__t')?.focus();
  }, [sizesOpen]);

  const closeSizes = () => {
    setSizesOpen(false);
    requestAnimationFrame(() => addRef.current?.focus());
  };

  const add = (size) => {
    addItem(product, size, color, 1);
    setSizesOpen(false);
  };

  return (
    <article
      className={`qs-card mask ${soldOut ? 'qs-card--agotado' : ''}`}
      style={{ '--n': index % 4 }}
      aria-labelledby={`${uid}-n`}
      onMouseEnter={back ? startCycle : undefined}
      onMouseLeave={back ? stopCycle : undefined}
    >
      <div className="qs-card__foto" data-ver2={showBack || undefined}>
        <Link href={href} className="qs-card__link" tabIndex={-1} aria-hidden="true">
          {front && (
            <Image src={front} alt="" fill sizes={SIZES_ATTR} className="qs-card__img" priority={priority} />
          )}
          {back && <Image src={back} alt="" fill sizes={SIZES_ATTR} className="qs-card__img qs-card__img--alt" />}
        </Link>

        {(soldOut || product.is_new || product.is_bestseller) && (
          <div className="qs-card__tags">
            {soldOut && <span className="qs-tag qs-tag--tinta">Sold out</span>}
            {!soldOut && product.is_new && <span className="qs-tag">New</span>}
            {!soldOut && product.is_bestseller && <span className="qs-tag qs-tag--tinta">Bestseller</span>}
          </div>
        )}

        {!soldOut && (
          <div className="qs-rapido">
            {sizes.length === 1 ? (
              <button
                type="button"
                className="qs-rapido__abrir"
                onClick={() => add(sizes[0])}
                aria-label={`Add ${product.name} to bag`}
              >
                Add to bag
              </button>
            ) : sizesOpen ? (
              <div
                className="qs-rapido__lista"
                role="group"
                aria-label={`Choose a size for ${product.name}`}
                ref={listRef}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    closeSizes();
                  }
                }}
              >
                <p>
                  <span>Size</span>
                  <button type="button" onClick={closeSizes} aria-label="Close sizes">✕</button>
                </p>
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="qs-rapido__t"
                    onClick={() => add(s)}
                    aria-label={`Add ${product.name}, size ${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <button
                ref={addRef}
                type="button"
                className="qs-rapido__abrir"
                aria-expanded="false"
                aria-label={`Quick add ${product.name}`}
                onClick={() => setSizesOpen(true)}
              >
                Add
              </button>
            )}
          </div>
        )}
      </div>

      <div className="qs-card__info">
        <h3 className="qs-card__nombre" id={`${uid}-n`}>
          <Link href={href}>{product.name}</Link>
        </h3>
        <p className="qs-card__precio">
          <span>{formatINR(product.price)}</span>
          {product.compare_price > product.price && (
            <s>
              <span className="qs-sr">was </span>
              {formatINR(product.compare_price)}
            </s>
          )}
        </p>
        {onRemove && (
          <div className="qs-card__acciones">
            <button type="button" className="qs-quitar" onClick={() => onRemove(product)}>
              Remove<span className="qs-sr"> {product.name} from wishlist</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
