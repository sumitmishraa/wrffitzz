import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollToTop from '@/components/ScrollToTop';

export const metadata = {
  title: 'wrfitzz - Modern Streetwear & Premium Apparel',
  description: 'Shop contemporary streetwear, snap sweatpants, parachute bottoms, tracksuits and artisanal shirts at wrfitzz.',
  keywords: 'wrfitzz, streetwear, trackpants, sweatpants, snap button, parachute pants, oversized t-shirts, fashion',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <CartDrawer />
              <main>{children}</main>
              <Footer />
              <ScrollToTop />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
