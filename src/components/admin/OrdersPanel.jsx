'use client';
import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import useDialog from '@/hooks/useDialog';
import { formatINR } from '@/lib/pricing';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, formatDateTime } from './adminApi';

const OPEN_STATUSES = ['confirmed', 'packing', 'shipped', 'out_for_delivery'];

function StatusPill({ status }) {
  return <span className={`adm-pill adm-pill--${status}`}>{ORDER_STATUS_LABELS[status] || status}</span>;
}

function OrderDrawer({ order, call, onClose, onSaved }) {
  const close = useCallback(() => onClose(), [onClose]);
  const panelRef = useDialog(Boolean(order), close);
  const [form, setForm] = useState(() => ({
    status: order.status,
    payment_status: order.payment_status || (order.payment_method === 'COD' ? 'PENDING_COD' : 'PAID'),
    courier: order.courier || '',
    tracking_number: order.tracking_number || '',
    estimated_delivery: order.estimated_delivery || '',
    admin_notes: order.admin_notes || '',
  }));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const phone = String(order.customer_phone || '').replace(/\D/g, '').slice(-10);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const data = await call('/api/orders', { method: 'PATCH', body: { id: order.id, ...form, note: note.trim() || undefined } });
      onSaved(data.order);
      setNote('');
      setMessage({ type: 'ok', text: 'Order updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="qs-velo" onClick={close} aria-hidden="true" />
      <div ref={panelRef} className="qs-drawer adm-drawer" role="dialog" aria-modal="true" aria-labelledby="ord-t" tabIndex={-1}>
        <div className="qs-drawer__cab">
          <h2 id="ord-t">Order {order.id}</h2>
          <button className="qs-cerrar" type="button" aria-label="Close order" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <form className="qs-drawer__cuerpo" onSubmit={save}>
          <div className="adm-fila-meta">
            <StatusPill status={order.status} />
            <span className="qs-hint">Placed {formatDateTime(order.created_at)}</span>
          </div>

          <section className="adm-bloque" aria-labelledby="ord-cliente">
            <h3 id="ord-cliente" className="qs-caja__titulo">Customer</h3>
            <dl className="qs-datos">
              <div><dt>Name</dt><dd>{order.customer_name}</dd></div>
              <div><dt>Phone</dt><dd>{phone ? `+91 ${phone}` : '—'}</dd></div>
              <div><dt>Email</dt><dd>{order.customer_email || '—'}</dd></div>
              <div><dt>Address</dt><dd>{order.shipping_address}{order.pincode && !String(order.shipping_address).includes(order.pincode) ? `, ${order.pincode}` : ''}</dd></div>
            </dl>
            <div className="qs-botones">
              {phone && <a className="boton" href={`tel:+91${phone}`}>Call</a>}
              {phone && (
                <a className="boton" href={`https://wa.me/91${phone}?text=${encodeURIComponent(`Hi ${order.customer_name?.split(' ')[0] || ''}, about your wrfitzz order ${order.id}`)}`} target="_blank" rel="noreferrer">
                  WhatsApp<span className="qs-sr"> (opens in a new tab)</span>
                </a>
              )}
              {order.customer_email && <a className="boton" href={`mailto:${order.customer_email}?subject=${encodeURIComponent(`Your wrfitzz order ${order.id}`)}`}>Email</a>}
            </div>
          </section>

          <section className="adm-bloque" aria-labelledby="ord-items">
            <h3 id="ord-items" className="qs-caja__titulo">Pieces</h3>
            <ul className="qs-lineas">
              {order.items.map((item, i) => (
                <li key={`${item.product_id || item.name}-${i}`} className="qs-linea">
                  <span className="qs-linea__foto">
                    {item.image && <Image src={item.image} alt="" fill sizes="72px" />}
                  </span>
                  <div className="qs-linea__datos">
                    <span className="qs-linea__nombre">{item.name}</span>
                    <span className="qs-linea__meta">{[item.color, item.size && `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}</span>
                  </div>
                  <div className="qs-linea__der"><span>{formatINR(item.price * item.quantity)}</span></div>
                </li>
              ))}
            </ul>
            <dl className="qs-totales">
              {order.subtotal != null && <div><dt>Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>}
              {order.shipping != null && <div><dt>Delivery</dt><dd>{order.shipping ? formatINR(order.shipping) : 'Free'}</dd></div>}
              {order.discount > 0 && <div className="qs-totales__ahorro"><dt>Prepaid discount</dt><dd>−{formatINR(order.discount)}</dd></div>}
              <div className="qs-totales__total"><dt>Total</dt><dd>{formatINR(order.total_amount)}</dd></div>
            </dl>
            {order.razorpay_payment_id && <p className="qs-hint">Razorpay payment {order.razorpay_payment_id}</p>}
          </section>

          <section className="adm-bloque" aria-labelledby="ord-envio">
            <h3 id="ord-envio" className="qs-caja__titulo">Fulfilment</h3>
            <div className="qs-grid">
              <div className="qs-field">
                <label className="qs-label" htmlFor="ord-status">Order status</label>
                <select id="ord-status" className="qs-select adm-select" value={form.status} onChange={set('status')}>
                  {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="ord-pay">Payment</label>
                <select id="ord-pay" className="qs-select adm-select" value={form.payment_status} onChange={set('payment_status')}>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="ord-courier">Courier</label>
                <input id="ord-courier" className="qs-input" value={form.courier} onChange={set('courier')} placeholder="Dunzo, Porter, own rider…" />
              </div>
              <div className="qs-field">
                <label className="qs-label" htmlFor="ord-track">Tracking number</label>
                <input id="ord-track" className="qs-input" value={form.tracking_number} onChange={set('tracking_number')} />
              </div>
              <div className="qs-field qs-field--full">
                <label className="qs-label" htmlFor="ord-eta">Expected delivery</label>
                <input id="ord-eta" className="qs-input" value={form.estimated_delivery} onChange={set('estimated_delivery')} placeholder="Tomorrow by 8 PM" />
              </div>
              <div className="qs-field qs-field--full">
                <label className="qs-label" htmlFor="ord-notes">Internal notes <i>· only you see these</i></label>
                <textarea id="ord-notes" className="qs-input adm-textarea" rows={3} value={form.admin_notes} onChange={set('admin_notes')} />
              </div>
              <div className="qs-field qs-field--full">
                <label className="qs-label" htmlFor="ord-note">Add to history <i>· optional</i></label>
                <input id="ord-note" className="qs-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Handed to rider at 4 PM" />
              </div>
            </div>
          </section>

          <section className="adm-bloque" aria-labelledby="ord-hist">
            <h3 id="ord-hist" className="qs-caja__titulo">History</h3>
            {order.history.length === 0 ? (
              <p className="qs-hint">No updates yet.</p>
            ) : (
              <ol className="adm-historia">
                {[...order.history].reverse().map((h, i) => (
                  <li key={`${h.at}-${i}`}>
                    <b>{ORDER_STATUS_LABELS[h.status] || h.status}</b>
                    <span className="qs-hint">{formatDateTime(h.at)}</span>
                    {h.note && <span>{h.note}</span>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="adm-guardar">
            <div aria-live="polite">
              {message && (
                <p className={message.type === 'ok' ? 'qs-ok-text' : 'qs-error-text'} role={message.type === 'ok' ? 'status' : 'alert'}>
                  {message.text}
                </p>
              )}
            </div>
            <button type="submit" className="boton boton--lleno boton--ancho" disabled={busy} aria-busy={busy || undefined}>
              Save changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function OrdersPanel({ orders, call, onOrderSaved, loading }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('open');
  const [payment, setPayment] = useState('all');
  const [openId, setOpenId] = useState(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (status === 'open' && !OPEN_STATUSES.includes(o.status)) return false;
      if (status !== 'open' && status !== 'all' && o.status !== status) return false;
      if (payment !== 'all' && (o.payment_method === 'COD' ? 'cod' : 'online') !== payment) return false;
      if (!q) return true;
      return [o.id, o.customer_name, o.customer_phone, o.customer_email, o.tracking_number, o.pincode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orders, query, status, payment]);

  const openOrder = orders.find((o) => o.id === openId);

  return (
    <section aria-labelledby="ord-titulo">
      <div className="adm-panel-cab">
        <div>
          <h1 id="ord-titulo" className="adm-h1">Orders</h1>
          <p className="qs-sub" aria-live="polite">{shown.length} of {orders.length} orders</p>
        </div>
      </div>

      <div className="qs-filtros adm-filtros" role="search" aria-label="Filter orders">
        <div className="qs-field qs-filtro qs-filtro--buscar">
          <label className="qs-label" htmlFor="ord-q">Search</label>
          <input id="ord-q" className="qs-input" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order, name, phone, PIN" />
        </div>
        <div className="qs-field qs-filtro">
          <label className="qs-label" htmlFor="ord-f-status">Status</label>
          <select id="ord-f-status" className="qs-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open orders</option>
            <option value="all">All orders</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="qs-field qs-filtro">
          <label className="qs-label" htmlFor="ord-f-pay">Payment</label>
          <select id="ord-f-pay" className="qs-select" value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="all">All</option>
            <option value="online">Paid online</option>
            <option value="cod">Cash on delivery</option>
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="qs-empty">
          <h2>{loading ? 'Loading orders…' : orders.length === 0 ? 'No orders yet' : 'No orders match'}</h2>
          {!loading && orders.length > 0 && <p>Try “All orders” or clear the search.</p>}
        </div>
      ) : (
        <div className="adm-tabla-wrap">
          <table className="adm-tabla">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Placed</th>
                <th scope="col">Customer</th>
                <th scope="col">Pieces</th>
                <th scope="col" className="adm-num">Total</th>
                <th scope="col">Payment</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id}>
                  <th scope="row">
                    <button type="button" className="adm-link" onClick={() => setOpenId(o.id)}>{o.id}</button>
                  </th>
                  <td>{formatDateTime(o.created_at)}</td>
                  <td>
                    <span className="adm-celda-2">
                      <b>{o.customer_name}</b>
                      <span className="qs-hint">{o.pincode}</span>
                    </span>
                  </td>
                  <td>{o.items.reduce((n, i) => n + Number(i.quantity || 0), 0)}</td>
                  <td className="adm-num">{formatINR(o.total_amount)}</td>
                  <td>{PAYMENT_STATUS_LABELS[o.payment_status] || (o.payment_method === 'COD' ? 'Cash on delivery' : 'Online')}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openOrder && (
        <OrderDrawer
          key={openOrder.id}
          order={openOrder}
          call={call}
          onClose={() => setOpenId(null)}
          onSaved={onOrderSaved}
        />
      )}
    </section>
  );
}
