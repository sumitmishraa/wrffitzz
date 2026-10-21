import Link from 'next/link';
import { FREE_DELIVERY_OVER, PREPAID_DISCOUNT, formatINR } from '@/lib/pricing';

const WHATSAPP = 'https://wa.me/919845000000?text=Hi%20wrfitzz%20team%2C%20I%20have%20a%20question%20about%20your%20pieces.';

export default function QuietFooter({ categories = [] }) {
  return (
    <footer className="pie" id="pie">
      <ul className="pie__rasgos">
        <li>
          <b>Made in Bangalore</b>
          <span>Cut and sewn in small runs at our atelier.</span>
        </li>
        <li>
          <b>Bangalore express delivery</b>
          <span>Free over {formatINR(FREE_DELIVERY_OVER)}. Dispatched within 24 hours.</span>
        </li>
        <li>
          <b>15-day exchanges</b>
          <span>Swap size or style with a reverse pickup.</span>
        </li>
        <li>
          <b>{Math.round(PREPAID_DISCOUNT * 100)}% off prepaid</b>
          <span>Taken off at checkout when you pay online.</span>
        </li>
      </ul>

      <nav className="qs-pie-nav" aria-label="Footer">
        <ul>
          <li><Link href="/shop">Shop all</Link></li>
          {categories.map((c) => (
            <li key={c.slug}><Link href={`/shop/${c.slug}`}>{c.name}</Link></li>
          ))}
          <li><Link href="/wishlist">Wishlist</Link></li>
          <li><Link href="/cart">Bag</Link></li>
          <li>
            <a href={WHATSAPP} target="_blank" rel="noreferrer">
              WhatsApp us<span className="qs-sr"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </nav>

      <p className="pie__gigante" aria-hidden="true">
        <span>wrfitzz<sup>®</sup></span>
      </p>

      <div className="pie__base">
        <p>
          <b>wrfitzz® Bangalore Atelier.</b> Made to stay. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
