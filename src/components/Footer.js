import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <Link href="/" className="footer__logo">
              wrfitzz<span className="logo-dot">.</span>
            </Link>
            <p className="footer__tagline">
              Premium clothing crafted for the modern individual. Handcrafted heavyweight fabrics, precision tailoring, and timeless streetwear.
            </p>
            <div className="footer__atelier-badge">
              <span className="footer__atelier-dot" />
              <span>BANGALORE ATELIER · EST. 2026</span>
            </div>
            <div className="footer__trust-strip">
              <span>⚡ Express Dispatch</span>
              <span>·</span>
              <span>💎 100% Genuine</span>
              <span>·</span>
              <span>🔄 15-Day Return</span>
            </div>
          </div>

          <div className="footer__column">
            <h4>Shop</h4>
            <ul>
              <li><Link href="/shop">All Products</Link></li>
              <li><Link href="/shop/shirts">Shirts</Link></li>
              <li><Link href="/shop/trousers">Trousers</Link></li>
              <li><Link href="/shop/dresses">Dresses</Link></li>
              <li><Link href="/shop/accessories">Accessories</Link></li>
            </ul>
          </div>

          <div className="footer__column">
            <h4>Help</h4>
            <ul>
              <li><a href="#">Track Order</a></li>
              <li><a href="#">Shipping Policy</a></li>
              <li><a href="#">Returns & Exchange</a></li>
              <li><a href="#">Size Guide</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>

          <div className="footer__column">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} wrfitzz. All rights reserved.</p>
          <p>Crafted with precision in India</p>
        </div>
      </div>
    </footer>
  );
}
