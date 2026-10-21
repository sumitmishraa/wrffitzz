import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export const viewport = {
  themeColor: '#CCCED3',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'wrfitzz® · Made to stay · Bangalore Atelier',
  description: 'wrfitzz. Everyday essentials made in small runs in Bangalore Atelier. Pick your size and colour, build your order and send it by WhatsApp.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="sin-portal listo js">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,500;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Unbounded:wght@500;700;800&family=Figtree:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('sin-portal','listo','js');`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
