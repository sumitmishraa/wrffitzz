'use client';
import Image from 'next/image';
import Link from 'next/link';
import { computeTotals, formatINR, PREPAID_DISCOUNT } from '@/lib/pricing';

const FALLBACK_IMG = '/images/products/geometric-shirt-front.jpg';

export function BagLines({ items, editable = false, onQuantity, onRemove, onNavigate }) {
  return (
    <ul className="qs-lineas">
      {items.map((item, idx) => {
        const name = editable ? (
          <Link href={`/product/${item.slug}`} className="qs-linea__nombre" onClick={onNavigate}>
            {item.name}
          </Link>
        ) : (
          <span className="qs-linea__nombre">{item.name}</span>
        );
        return (
          <li key={item.key || `${item.product_id || item.id}-${item.size}-${idx}`} className="qs-linea">
            <span className="qs-linea__foto">
              <Image src={item.image || FALLBACK_IMG} alt="" fill sizes="72px" />
              {!editable && item.quantity > 1 && <b aria-hidden="true">{item.quantity}</b>}
            </span>
            <div className="qs-linea__datos">
              {name}
              <span className="qs-linea__meta">
                {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' · ')}
              </span>
              {editable ? (
                <div className="qs-stepper" role="group" aria-label={`Quantity of ${item.name}`}>
                  <button
                    type="button"
                    onClick={() => onQuantity(item.key, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <output aria-live="polite">{item.quantity}</output>
                  <button
                    type="button"
                    onClick={() => onQuantity(item.key, item.quantity + 1)}
                    disabled={item.quantity >= 10}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="qs-linea__meta">Qty {item.quantity} · {formatINR(item.price)} each</span>
              )}
            </div>
            <div className="qs-linea__der">
              <span>{formatINR(item.price * item.quantity)}</span>
              {editable && (
                <button type="button" className="qs-quitar" onClick={() => onRemove(item.key)}>
                  Remove<span className="qs-sr"> {item.name}</span>
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// method: 'online' | 'cod' | 'either' (not chosen yet: show the online price and the COD price)
export function BagTotals({ subtotal, method = 'either' }) {
  const online = computeTotals(subtotal, { prepaid: true });
  const cod = computeTotals(subtotal, { prepaid: false });
  const shown = method === 'cod' ? cod : online;
  const pct = Math.round(PREPAID_DISCOUNT * 100);

  return (
    <div className="qs-resumen">
      <dl className="qs-totales">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatINR(shown.subtotal)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{shown.delivery === 0 ? 'Free' : formatINR(shown.delivery)}</dd>
        </div>
        {method !== 'cod' && shown.discount > 0 && (
          <div className="qs-totales__ahorro">
            <dt>{pct}% off, paying online</dt>
            <dd>−{formatINR(shown.discount)}</dd>
          </div>
        )}
        <div className="qs-totales__total">
          <dt>{method === 'either' ? 'Total, paying online' : 'Total'}</dt>
          <dd>{formatINR(shown.total)}</dd>
        </div>
      </dl>
      {method === 'either' && cod.total > 0 && (
        <p className="qs-nota">Cash on delivery: {formatINR(cod.total)}. Taxes included.</p>
      )}
    </div>
  );
}
