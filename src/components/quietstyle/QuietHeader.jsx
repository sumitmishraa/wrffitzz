'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import AccountModal from '@/components/AccountModal';
import useDialog from '@/hooks/useDialog';

export default function QuietHeader({ categories = [] }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { totalItems: savedCount } = useWishlist();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useDialog(menuOpen, closeMenu);

  // On the home page the big wordmark flies into the logo slot over the first
  // 30% of a screen (HeroStage); the header logo stays hidden until it lands.
  const [heroFlight, setHeroFlight] = useState(true);

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      setHeroFlight(!still && window.scrollY < window.innerHeight * 0.3 * 0.999);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Leaving the page closes the menu.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  // The payment confirmation screen asks for the orders tab.
  useEffect(() => {
    const openOrders = () => setAccountOpen(true);
    window.addEventListener('wrfitzz_open_profile_orders', openOrders);
    return () => window.removeEventListener('wrfitzz_open_profile_orders', openOrders);
  }, []);

  const handleSearchClick = (e) => {
    if (!pathname.startsWith('/shop')) return;
    const field = document.getElementById('q');
    if (field) {
      e.preventDefault();
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.focus({ preventScroll: true });
    }
  };

  const current = (href) => (pathname === href ? 'page' : undefined);

  return (
    <>
      <div className={`cab-vel ${scrolled ? 'visible' : ''} ${isHome ? '' : 'oculto'}`} aria-hidden="true" />
      <header
        className={`cab ${isHome ? `${scrolled ? 'cab--solida' : ''} ${heroFlight ? 'hero' : ''}` : 'cab--pagina'}`}
        id="cab"
      >
        <div className="cab__in">
          <button
            className="cab__boton cab__menu-btn"
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="lateral"
            onClick={() => setMenuOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h16M4 15h10" />
            </svg>
          </button>

          <Link href="/" className="logo" aria-label="wrfitzz, home">
            <span className="logo__nombre">wrfitzz</span>
          </Link>

          <div className="cab__acciones">
            <Link
              href="/shop#buscar"
              className="cab__boton"
              id="abrirBuscar"
              aria-label="Search the shop"
              onClick={handleSearchClick}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l5 5" />
              </svg>
            </Link>

            <button
              className="cab__boton cab__cuenta-btn"
              type="button"
              aria-label={user ? `Account, signed in as ${user.displayName || user.name || user.email || user.phone}` : 'Sign in'}
              aria-haspopup="dialog"
              onClick={() => setAccountOpen(true)}
            >
              {user ? (
                <span className="cab__usuario-avatar" aria-hidden="true">
                  {(user.displayName?.[0] || user.name?.[0] || user.email?.[0] || 'W').toUpperCase()}
                </span>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </button>

            <button
              className="cab__boton"
              type="button"
              aria-label={totalItems > 0 ? `Open bag, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : 'Open bag, empty'}
              aria-haspopup="dialog"
              onClick={() => setCartOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 8h14l-1.2 11H6.2zM9 8V6.5a3 3 0 016 0V8" />
              </svg>
              {totalItems > 0 && (
                <span className="cab__cuenta" aria-hidden="true">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className={`lat-vel ${menuOpen ? 'abierto' : ''}`} hidden={!menuOpen} onClick={closeMenu} />
      <aside
        ref={menuRef}
        className={`lat ${menuOpen ? 'abierto' : ''}`}
        id="lateral"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        tabIndex={-1}
      >
        <div className="lat__cab">
          <span className="lat__marca">wrfitzz<sup>®</sup></span>
          <button className="lat__cerrar" type="button" aria-label="Close menu" onClick={closeMenu}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="lat__nav" aria-label="Shop">
          <Link href="/" aria-current={current('/')}>Home</Link>
          <Link href="/shop" aria-current={current('/shop')}>Shop all</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop/${c.slug}`} aria-current={current(`/shop/${c.slug}`)}>
              {c.name}
            </Link>
          ))}
          <p className="lat__sec">Your pieces</p>
          <Link href="/wishlist" aria-current={current('/wishlist')}>
            Wishlist{savedCount > 0 ? ` (${savedCount})` : ''}
          </Link>
          <Link href="/cart" aria-current={current('/cart')}>
            Bag{totalItems > 0 ? ` (${totalItems})` : ''}
          </Link>
          <div className="lat__divider" />
          <button
            type="button"
            className="lat__cuenta-link"
            onClick={() => { setMenuOpen(false); setAccountOpen(true); }}
          >
            {user ? 'Your account' : 'Sign in or create an account'}
          </button>
        </nav>
      </aside>

      <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
