import Link from 'next/link';
import { FREE_DELIVERY_OVER, PREPAID_DISCOUNT, formatINR } from '@/lib/pricing';

const WHATSAPP_TEXT = encodeURIComponent('Hi wrfitzz team, I have a question about your pieces.');

// Numbers are stored as 91 + 10 digits; show them as +91 98450 00000
function displayPhone(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (digits.length !== 12) return digits ? `+${digits}` : '';
  return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
}

export default function QuietFooter({ categories = [], settings = {} }) {
  const { whatsapp_number, contact_phone, contact_email, store_address, store_hours, instagram_url } = settings;

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
          {whatsapp_number && (
            <li>
              <a href={`https://wa.me/${whatsapp_number}?text=${WHATSAPP_TEXT}`} target="_blank" rel="noreferrer">
                WhatsApp us<span className="qs-sr"> (opens in a new tab)</span>
              </a>
            </li>
          )}
          {instagram_url && (
            <li>
              <a href={instagram_url} target="_blank" rel="noreferrer">
                Instagram<span className="qs-sr"> (opens in a new tab)</span>
              </a>
            </li>
          )}
        </ul>
      </nav>

      <p className="pie__gigante" aria-hidden="true">
        <span>wrfitzz<sup>®</sup></span>
      </p>

      <div className="pie__base">
        <p>
          <b>wrfitzz® Bangalore Atelier.</b> Made to stay. All rights reserved.
        </p>
        <address className="qs-pie-contacto">
          {store_address && <span>{store_address}</span>}
          {store_hours && <span>{store_hours}</span>}
          {contact_phone && <a href={`tel:+${contact_phone}`}>{displayPhone(contact_phone)}</a>}
          {contact_email && <a href={`mailto:${contact_email}`}>{contact_email}</a>}
        </address>
      </div>
    </footer>
  );
}
