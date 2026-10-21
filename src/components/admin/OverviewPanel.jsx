'use client';
import { useMemo, useState } from 'react';
import { formatINR } from '@/lib/pricing';
import { ORDER_STATUS_LABELS, formatDateTime } from './adminApi';

const OPEN = ['confirmed', 'packing', 'shipped', 'out_for_delivery'];
const DAY = 24 * 60 * 60 * 1000;

function Stat({ label, value, hint }) {
  return (
    <div className="adm-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <p className="qs-hint">{hint}</p>}
    </div>
  );
}

export default function OverviewPanel({ orders, products, onOpenTab }) {
  const [now] = useState(() => Date.now());

  const stats = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const time = (o) => new Date(o.created_at || 0).getTime();
    const live = orders.filter((o) => !['cancelled', 'returned'].includes(o.status));
    const earned = live.filter((o) => o.payment_status === 'PAID' || o.payment_status === 'COD_COLLECTED');
    return {
      today: orders.filter((o) => time(o) >= today.getTime()).length,
      revenue30: earned.filter((o) => time(o) >= now - 30 * DAY).reduce((s, o) => s + Number(o.total_amount || 0), 0),
      open: orders.filter((o) => OPEN.includes(o.status)).length,
      codDue: live
        .filter((o) => o.payment_status === 'PENDING_COD')
        .reduce((s, o) => s + Number(o.total_amount || 0), 0),
      liveProducts: products.filter((p) => p.is_visible).length,
      hidden: products.filter((p) => !p.is_visible).length,
      soldOut: products.filter((p) => p.in_stock === false).length,
    };
  }, [orders, products, now]);

  const recent = orders.slice(0, 6);

  return (
    <section aria-labelledby="ov-titulo">
      <div className="adm-panel-cab">
        <div>
          <h1 id="ov-titulo" className="adm-h1">Overview</h1>
          <p className="qs-sub">A quick look at orders and the catalogue.</p>
        </div>
      </div>

      <dl className="adm-stats">
        <Stat label="Orders today" value={stats.today} />
        <Stat label="Open orders" value={stats.open} hint="Not yet delivered or cancelled" />
        <Stat label="Revenue, last 30 days" value={formatINR(stats.revenue30)} hint="Paid online and cash collected" />
        <Stat label="Cash to collect" value={formatINR(stats.codDue)} hint="Cash-on-delivery orders not yet paid" />
        <Stat label="Live products" value={stats.liveProducts} />
        <Stat label="Switched off" value={stats.hidden} />
        <Stat label="Sold out" value={stats.soldOut} />
      </dl>

      <div className="adm-panel-cab">
        <h2 className="qs-caja__titulo">Latest orders</h2>
        <button type="button" className="boton boton--texto" onClick={() => onOpenTab('orders')}>All orders</button>
      </div>
      {recent.length === 0 ? (
        <p className="qs-hint">No orders yet.</p>
      ) : (
        <ul className="adm-recientes">
          {recent.map((o) => (
            <li key={o.id}>
              <b>{o.id}</b>
              <span>{o.customer_name}</span>
              <span className="qs-hint">{formatDateTime(o.created_at)}</span>
              <span>{formatINR(o.total_amount)}</span>
              <span className={`adm-pill adm-pill--${o.status}`}>{ORDER_STATUS_LABELS[o.status] || o.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
