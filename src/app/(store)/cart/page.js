'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { computeTotals, formatINR } from '@/lib/pricing';
import { BagLines, BagTotals } from '@/components/quietstyle/BagSummary';

export default function CartPage() {
  const { items, loaded, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { freeDeliveryRemaining } = computeTotals(totalPrice);

  return (
    <div className="qs-page">
      <div className="qs-page__in">
        <nav aria-label="Breadcrumb">
          <ol className="qs-migas">
            <li><Link href="/">Home</Link></li>
            <li><span aria-current="page">Bag</span></li>
          </ol>
        </nav>
        <div className="qs-cab">
          <p className="qs-eyebrow">Your bag</p>
          <h1 className="qs-h1">
            {!loaded ? 'Your bag' : items.length === 0 ? 'Nothing here yet' : `${totalItems} ${totalItems === 1 ? 'piece' : 'pieces'}`}
          </h1>
        </div>

        {!loaded ? (
          <p className="qs-sub" aria-busy="true">Loading your bag…</p>
        ) : items.length === 0 ? (
          <div className="qs-empty">
            <p>Your bag is empty. Pieces you add will wait here while you keep browsing.</p>
            <Link href="/shop" className="boton boton--lleno">Shop all pieces</Link>
          </div>
        ) : (
          <div className="qs-dos">
            <section className="qs-caja" aria-labelledby="bolsa-piezas">
              <div className="qs-fila">
                <h2 className="qs-caja__titulo" id="bolsa-piezas">Pieces</h2>
                <button type="button" className="qs-quitar" onClick={clearCart}>Remove all</button>
              </div>
              <BagLines items={items} editable onQuantity={updateQuantity} onRemove={removeItem} />
            </section>

            <aside className="qs-caja qs-pegajoso" aria-labelledby="bolsa-resumen">
              <h2 className="qs-caja__titulo" id="bolsa-resumen">Summary</h2>
              <div className="qs-form">
                <BagTotals subtotal={totalPrice} />
                {freeDeliveryRemaining > 0 && (
                  <p className="qs-hint">Add {formatINR(freeDeliveryRemaining)} more for free delivery.</p>
                )}
                <Link href="/checkout" className="boton boton--lleno boton--ancho">Checkout</Link>
                <Link href="/shop" className="boton boton--texto">Keep shopping</Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
