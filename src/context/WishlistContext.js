'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrfitzz-wishlist');
      if (saved) setItems(JSON.parse(saved));
    } catch (e) { /* ignore */ }
    setLoaded(true);
  }, []);

  // Persist only after the saved list has been read (see CartContext).
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem('wrfitzz-wishlist', JSON.stringify(items)); } catch (e) { /* ignore */ }
  }, [items, loaded]);

  const addItem = useCallback((product) => {
    setItems(prev => {
      if (prev.find(i => i.id === product.id)) return prev;
      return [...prev, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compare_price: product.compare_price,
        image: product.images?.[0] || '',
        category: product.category,
      }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const isInWishlist = useCallback((id) => {
    return items.some(i => i.id === id);
  }, [items]);

  const toggleItem = useCallback((product) => {
    if (isInWishlist(product.id)) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  }, [isInWishlist, removeItem, addItem]);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, toggleItem, totalItems: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
