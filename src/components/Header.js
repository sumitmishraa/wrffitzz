'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import SearchModal from './SearchModal';
import AccountModal from './AccountModal';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { totalItems: wishlistTotal } = useWishlist();
  const { user } = useAuth();

  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleOpenOrders = () => {
      setAccountOpen(true);
    };
    window.addEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
    return () => window.removeEventListener('wrfitzz_open_profile_orders', handleOpenOrders);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      {announcementVisible && (
        <div className="announcement-bar">
          <div className="announcement-bar__content">
            <span>
              Free Delivery on orders over ₹1,999 &nbsp;·&nbsp;
              <strong className="announcement-highlight"> 10% Off on Prepaid Orders</strong>
            </span>
          </div>
          <button
            className="announcement-bar__close"
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Close announcement"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className={`sf-header ${isScrolled ? 'sf-header--scrolled' : ''}`}>
        <div className="sf-header__wrapper container-fluid">
          {/* Brand Logo - Completely on the Left */}
          <div className="sf-header__left-group">
            {/* Mobile Hamburger (Strictly hidden on desktop) */}
            <button
              className="sf-header__menu-btn sf-header__menu-btn--mobile-only"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="22" height="22" fill="currentColor" viewBox="0 0 448 512">
                <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
              </svg>
            </button>

            <div className="sf-header__logo-wrap">
              <Link href="/" className="sf-logo">
                wrfitzz<span className="logo-dot">.</span>
              </Link>
            </div>
          </div>

          {/* Desktop Center Navigation - Fully Visible, No Hovering/Floating Bar */}
          <nav className="sf-nav sf-nav--desktop">
            <div className="sf-nav__item">
              <Link href="/shop" className="sf-nav__link">
                Shop All
              </Link>
            </div>

            <div className="sf-nav__item">
              <Link href="/shop/shirts" className="sf-nav__link">
                Shirts
              </Link>
            </div>

            <div className="sf-nav__item">
              <Link href="/shop/trousers" className="sf-nav__link">
                Trousers
              </Link>
            </div>

            <div className="sf-nav__item">
              <Link href="/shop/dresses" className="sf-nav__link">
                Dresses
              </Link>
            </div>

            <div className="sf-nav__item">
              <Link href="/shop/accessories" className="sf-nav__link">
                Accessories
              </Link>
            </div>

            <div className="sf-nav__item">
              <Link href="/shop/best-seller" className="sf-nav__link sf-nav__link--accent">
                Bestsellers
              </Link>
            </div>
          </nav>

          {/* Right Action Icons */}
          <div className="sf-header__actions">
            {/* Search */}
            <button
              className="sf-header__action-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              title="Search"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 512 512">
                <path d="M508.5 468.9L387.1 347.5c-2.3-2.3-5.3-3.5-8.5-3.5h-13.2c31.5-36.5 50.6-84 50.6-136C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c52 0 99.5-19.1 136-50.6v13.2c0 3.2 1.3 6.2 3.5 8.5l121.4 121.4c4.7 4.7 12.3 4.7 17 0l22.6-22.6c4.7-4.7 4.7-12.3 0-17zM208 368c-88.4 0-160-71.6-160-160S119.6 48 208 48s160 71.6 160 160-71.6 160-160 160z" />
              </svg>
            </button>

            {/* Account - Displays Verified User or Sign In */}
            <button
              className="sf-header__action-btn sf-header__account-btn"
              onClick={() => setAccountOpen(true)}
              aria-label="Account"
              title={user ? (user.name || user.phone) : 'Sign In'}
            >
              {user ? (
                <span className="sf-header__user-avatar" style={{ position: 'relative' }}>
                  {(user.name && user.name.trim().length > 0)
                    ? user.name.charAt(0).toUpperCase()
                    : '📱'}
                  {user.isAdmin && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      fontSize: '11px',
                    }}>
                      👑
                    </span>
                  )}
                </span>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M313.6 304c-28.7 0-42.5 16-89.6 16-47.1 0-60.8-16-89.6-16C60.2 304 0 364.2 0 438.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-25.6c0-74.2-60.2-134.4-134.4-134.4zM400 464H48v-25.6c0-47.6 38.8-86.4 86.4-86.4 14.6 0 38.3 16 89.6 16 51.7 0 74.9-16 89.6-16 47.6 0 86.4 38.8 86.4 86.4V464zM224 288c79.5 0 144-64.5 144-144S303.5 0 224 0 80 64.5 80 144s64.5 144 144 144zm0-240c52.9 0 96 43.1 96 96s-43.1 96-96 96-96-43.1-96-96 43.1-96 96-96z" />
                </svg>
              )}
              {user && (
                <span className="sf-header__user-name">
                  {user.name && user.name !== 'wrfitzz Member' ? user.name.split(' ')[0] : (user.phone ? user.phone.slice(-4) : 'Account')}
                </span>
              )}
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className="sf-header__action-btn" aria-label="Wishlist" title="Wishlist">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 576 512">
                <path d="M528.1 171.5L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6zM388.6 312.3l23.7 138.4L288 385.4l-124.3 65.3 23.7-138.4-100.6-98 139-20.2 62.2-126 62.2 126 139 20.2-100.6 98z" />
              </svg>
              {wishlistTotal > 0 && <span className="sf-badge">{wishlistTotal}</span>}
            </Link>

            {/* Cart */}
            <button
              className="sf-header__action-btn sf-header__cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              title="Cart"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 448 512">
                <path d="M352 128C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128H0v304c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V128h-96zM224 48c44.112 0 80 35.888 80 80H144c0-44.112 35.888-80 80-80zm176 384c0 17.645-14.355 32-32 32H80c-17.645 0-32-14.355-32-32V176h48v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h160v40c0 13.255 10.745 24 24 24s24-10.745 24-24v-40h48v256z" />
              </svg>
              <span className="sf-badge">{totalItems}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Menu */}
      <div className={`sf-mobile-drawer ${mobileMenuOpen ? 'sf-mobile-drawer--open' : ''}`}>
        <div className="sf-mobile-drawer__backdrop" onClick={closeMobile} />
        <div className="sf-mobile-drawer__panel">
          <div className="sf-mobile-drawer__header">
            <span className="sf-mobile-drawer__logo">
              wrfitzz<span className="logo-dot">.</span>
            </span>
            <button className="sf-mobile-drawer__close" onClick={closeMobile}>✕</button>
          </div>

          <div className="sf-mobile-drawer__content">
            <ul className="sf-mobile-links">
              <li>
                <Link href="/shop" className="sf-mobile-item" onClick={closeMobile}>
                  <span>Shop All</span>
                </Link>
              </li>
              <li>
                <Link href="/shop/shirts" className="sf-mobile-item" onClick={closeMobile}>
                  <span>Shirts</span>
                </Link>
              </li>
              <li>
                <Link href="/shop/trousers" className="sf-mobile-item" onClick={closeMobile}>
                  <span>Trousers</span>
                </Link>
              </li>
              <li>
                <Link href="/shop/dresses" className="sf-mobile-item" onClick={closeMobile}>
                  <span>Dresses</span>
                </Link>
              </li>
              <li>
                <Link href="/shop/accessories" className="sf-mobile-item" onClick={closeMobile}>
                  <span>Accessories</span>
                </Link>
              </li>
              <li>
                <Link href="/shop/best-seller" className="sf-mobile-item sf-mobile-item--accent" onClick={closeMobile}>
                  <span>Bestsellers</span>
                </Link>
              </li>
            </ul>

            {/* Account CTA in Mobile Menu */}
            <div className="sf-mobile-drawer__footer">
              <p className="sf-mobile-drawer__footer-title">My Account</p>
              <button
                className="btn btn--primary btn--full mb-2"
                onClick={() => { closeMobile(); setAccountOpen(true); }}
              >
                LOG IN
              </button>
              <button
                className="btn btn--outline btn--full"
                onClick={() => { closeMobile(); setAccountOpen(true); }}
              >
                REGISTER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
