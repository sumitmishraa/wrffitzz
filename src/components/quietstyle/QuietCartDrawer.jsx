'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import useDialog from '@/hooks/useDialog';
import { computeTotals, formatINR, FREE_DELIVERY_OVER } from '@/lib/pricing';
import { BagLines, BagTotals } from './BagSummary';

function whatsappText(items, subtotal) {
  const online = computeTotals(subtotal, { prepaid: true });
  const cod = computeTotals(subtotal, { prepaid: false });
  const lines = items.map(
    (item, i) => `${i + 1}. ${item.name} (${item.color || 'Standard'}, size ${item.size}) x ${item.quantity} = ${formatINR(item.price * item.quantity)}`
  );
  return [
    '*New order: wrfitzz Bangalore*',
    ...lines,
    `Subtotal: ${formatINR(online.subtotal)}`,
    `Delivery: ${online.delivery === 0 ? 'Free' : formatINR(online.delivery)}`,
    `Total paying online: ${formatINR(online.total)}`,
    `Total with cash on delivery: ${formatINR(cod.total)}`,
    '',
    'Please confirm availability.',
  ].join('\n');
}

export default function QuietCartDrawer({ whatsappNumber }) {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const panelRef = useDialog(isOpen, close);

  if (!isOpen) return null;

  const { freeDeliveryRemaining } = computeTotals(totalPrice);
  const progress = Math.min(100, Math.round((totalPrice / FREE_DELIVERY_OVER) * 100));

  return (
    <>
      <div className="qs-velo" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        className="qs-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bolsa-titulo"
        tabIndex={-1}
      >
        <div className="qs-drawer__cab">
          <h2 id="bolsa-titulo">Your bag{totalItems > 0 ? ` (${totalItems})` : ''}</h2>
          <button className="qs-cerrar" type="button" aria-label="Close bag" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="qs-drawer__cuerpo">
            <div className="qs-empty">
              <h2>Your bag is empty</h2>
              <p>Pieces you add will wait here while you keep browsing.</p>
              <Link href="/shop" className="boton boton--lleno" onClick={close}>Shop all pieces</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="qs-medidor" aria-live="polite">
              <p>
                {freeDeliveryRemaining > 0
                  ? <>Add <b>{formatINR(freeDeliveryRemaining)}</b> more for free delivery.</>
                  : <>Your order ships free.</>}
              </p>
              <div className="qs-medidor__barra" aria-hidden="true"><i style={{ '--w': `${progress}%` }} /></div>
            </div>

            <div className="qs-drawer__cuerpo">
              <BagLines
                items={items}
                editable
                onQuantity={updateQuantity}
                onRemove={removeItem}
                onNavigate={close}
              />
            </div>

            <div className="qs-drawer__pie">
              <BagTotals subtotal={totalPrice} />
              <Link href="/checkout" className="boton boton--lleno boton--ancho" onClick={close}>
                Checkout
              </Link>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText(items, totalPrice))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="boton boton--ancho"
                >
                  Order on WhatsApp<span className="qs-sr"> (opens in a new tab)</span>
                </a>
              )}
              <Link href="/cart" className="boton boton--texto" onClick={close}>View full bag</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
