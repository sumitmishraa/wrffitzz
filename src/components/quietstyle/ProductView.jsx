'use client';
import { useState, useRef, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import DeliveryEstimator from '@/components/DeliveryEstimator';
import { formatINR, PREPAID_DISCOUNT } from '@/lib/pricing';

function Arrow({ dir }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

export default function ProductView({ product }) {
  const uid = useId();
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const sizes = product.sizes?.length ? product.sizes : ['One Size'];
  const colors = product.colors?.length ? product.colors : [{ name: 'Standard', hex: '#CBCED3' }];
  const images = product.images?.length ? product.images : [];
  const soldOut = product.in_stock === false;

  const [photo, setPhoto] = useState(0);
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [color, setColor] = useState(colors[0].name);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const sizeGroupRef = useRef(null);
  const saved = isInWishlist(product.id);

  const go = (i) => setPhoto(Math.max(0, Math.min(images.length - 1, i)));

  const onSizeKey = (e, i) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (i + step + sizes.length) % sizes.length;
    setSize(sizes[next]);
    setError('');
    sizeGroupRef.current?.querySelectorAll('[role="radio"]')[next]?.focus();
  };

  const add = () => {
    if (!size) {
      setError('Choose a size to add this piece to your bag.');
      sizeGroupRef.current?.querySelector('[role="radio"]')?.focus();
      return;
    }
    setError('');
    addItem(product, size, color, qty);
  };

  return (
    <section className="qs-pdp" aria-labelledby={`${uid}-n`}>
      <nav aria-label="Breadcrumb" className="qs-page__in">
        <ol className="qs-migas">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/shop">Shop</Link></li>
          {product.category?.slug && (
            <li><Link href={`/shop/${product.category.slug}`}>{product.category.name}</Link></li>
          )}
          <li><span aria-current="page">{product.name}</span></li>
        </ol>
      </nav>

      <div className="qs-pdp__grid">
        <div className="qs-pdp__izq">
          <h1 className="qs-pdp__nombre" id={`${uid}-n`}>{product.name}</h1>
          <p className="qs-pdp__precio">
            <span>{formatINR(product.price)}</span>
            {product.compare_price > product.price && (
              <s><span className="qs-sr">was </span>{formatINR(product.compare_price)}</s>
            )}
          </p>
          <div className="qs-acordeon">
            <details open>
              <summary>Description</summary>
              <div className="qs-acordeon__cuerpo"><p>{product.description}</p></div>
            </details>
            <details>
              <summary>Material &amp; care</summary>
              <div className="qs-acordeon__cuerpo">
                {product.material && <p>{product.material}</p>}
                {product.care_instructions && <p>{product.care_instructions}</p>}
              </div>
            </details>
            <details>
              <summary>Delivery</summary>
              <div className="qs-acordeon__cuerpo"><DeliveryEstimator /></div>
            </details>
            <details>
              <summary>Exchanges</summary>
              <div className="qs-acordeon__cuerpo">
                <p>Swap size or style within 15 days of delivery. We collect it from your door.</p>
              </div>
            </details>
          </div>
        </div>

        <div className="qs-visor" role="group" aria-roledescription="gallery" aria-label={`Photos of ${product.name}`}>
          <div
            className="qs-visor__marco"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') go(photo - 1);
              if (e.key === 'ArrowRight') go(photo + 1);
            }}
          >
            {images.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={i === photo ? `${product.name}, photo ${i + 1} of ${images.length}` : ''}
                aria-hidden={i === photo ? undefined : true}
                fill
                priority={i === 0}
                sizes="(max-width: 900px) 100vw, 50vw"
                className="qs-visor__img"
                data-on={i === photo}
              />
            ))}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="qs-visor__flecha qs-visor__flecha--ant"
                  onClick={() => go(photo - 1)}
                  disabled={photo === 0}
                  aria-label="Previous photo"
                >
                  <Arrow dir="prev" />
                </button>
                <button
                  type="button"
                  className="qs-visor__flecha qs-visor__flecha--sig"
                  onClick={() => go(photo + 1)}
                  disabled={photo === images.length - 1}
                  aria-label="Next photo"
                >
                  <Arrow dir="next" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <ul className="qs-visor__minis">
              {images.map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    className="qs-mini"
                    onClick={() => go(i)}
                    aria-current={i === photo ? 'true' : undefined}
                    aria-label={`Show photo ${i + 1} of ${images.length}`}
                  >
                    <Image src={src} alt="" fill sizes="48px" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="qs-sr" aria-live="polite">Photo {photo + 1} of {images.length}</p>
        </div>

        <div className="qs-pdp__der">
          <div className="qs-grupo">
            <p className="qs-label" id={`${uid}-tl`}>
              Size{size ? <i> · {size}</i> : null}
            </p>
            <div
              className="qs-talles"
              role="radiogroup"
              aria-labelledby={`${uid}-tl`}
              aria-describedby={error ? `${uid}-err` : undefined}
              aria-required="true"
              ref={sizeGroupRef}
            >
              {sizes.map((s, i) => {
                const checked = size === s;
                const focusable = checked || (!size && i === 0);
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    tabIndex={focusable ? 0 : -1}
                    className="qs-talle"
                    disabled={soldOut}
                    onClick={() => { setSize(s); setError(''); }}
                    onKeyDown={(e) => onSizeKey(e, i)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {error && (
              <p className="qs-error-text" id={`${uid}-err`} role="alert">{error}</p>
            )}
          </div>

          <div className="qs-grupo">
            <p className="qs-label" id={`${uid}-cl`}>Colour<i> · {color}</i></p>
            {colors.length > 1 && (
              <div className="qs-muestras" role="radiogroup" aria-labelledby={`${uid}-cl`}>
                {colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={color === c.name}
                    aria-label={c.name}
                    className="qs-muestra"
                    style={{ '--c': c.hex }}
                    onClick={() => setColor(c.name)}
                  >
                    <span aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {soldOut ? (
            <p className="qs-pdp__agotado">Sold out</p>
          ) : (
            <div className="qs-grupo">
              <p className="qs-label" id={`${uid}-ql`}>Quantity</p>
              <div className="qs-stepper" role="group" aria-labelledby={`${uid}-ql`}>
                <button type="button" onClick={() => setQty(qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity">−</button>
                <output aria-live="polite">{qty}</output>
                <button type="button" onClick={() => setQty(qty + 1)} disabled={qty >= 10} aria-label="Increase quantity">+</button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="boton boton--lleno boton--ancho"
            onClick={add}
            disabled={soldOut}
          >
            {soldOut ? 'Sold out' : `Add to bag · ${formatINR(product.price * qty)}`}
          </button>

          <div className="qs-fila">
            <button
              type="button"
              className="qs-guardar"
              aria-pressed={saved}
              onClick={() => toggleItem(product)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
              </svg>
              <span>Save to wishlist</span>
            </button>
          </div>

          <ul className="qs-rasgos">
            <li>Dispatched within 24 hours in Bangalore</li>
            <li>{Math.round(PREPAID_DISCOUNT * 100)}% off when you pay online</li>
            <li>Cash on delivery available</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
