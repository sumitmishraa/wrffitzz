'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fallbackProducts } from '@/lib/fallback-data';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = fallbackProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.name.toLowerCase().includes(q) ||
      p.colors?.some(c => c.name.toLowerCase().includes(q))
    );
    setResults(filtered);
  }, [query]);

  if (!isOpen) return null;

  const popularTags = ['Trackpants', 'Sweatpants', 'Cargos', 'Flannel', 'Techwear', 'Shirts'];

  return (
    <div className="search-modal__overlay" onClick={onClose}>
      <div className="search-modal__container" onClick={e => e.stopPropagation()}>
        <div className="search-modal__header">
          <div className="search-modal__input-wrap">
            <svg className="search-modal__icon" width="20" height="20" fill="currentColor" viewBox="0 0 512 512">
              <path d="M508.5 468.9L387.1 347.5c-2.3-2.3-5.3-3.5-8.5-3.5h-13.2c31.5-36.5 50.6-84 50.6-136C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c52 0 99.5-19.1 136-50.6v13.2c0 3.2 1.3 6.2 3.5 8.5l121.4 121.4c4.7 4.7 12.3 4.7 17 0l22.6-22.6c4.7-4.7 4.7-12.3 0-17zM208 368c-88.4 0-160-71.6-160-160S119.6 48 208 48s160 71.6 160 160-71.6 160-160 160z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="search-modal__input"
              placeholder="Search products, styles, collections..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className="search-modal__clear" onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          <button className="search-modal__close" onClick={onClose} aria-label="Close search">
            ✕
          </button>
        </div>

        <div className="search-modal__content">
          {!query && (
            <div className="search-modal__suggestions">
              <p className="search-modal__section-title">Trending Searches</p>
              <div className="search-modal__tags">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    className="search-modal__tag"
                    onClick={() => setQuery(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="search-modal__empty">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <span>Try checking for spelling or searching with a different term</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="search-modal__results">
              <p className="search-modal__section-title">Products ({results.length})</p>
              <div className="search-modal__grid">
                {results.map(product => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="search-result-card"
                    onClick={onClose}
                  >
                    <div className="search-result-card__image">
                      <Image
                        src={product.colors?.[0]?.image || product.images?.[0] || '/images/products/geometric-shirt-front.jpg'}
                        alt={product.name}
                        fill
                        sizes="80px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="search-result-card__info">
                      <span className="search-result-card__category">{product.category?.name}</span>
                      <h4 className="search-result-card__title">{product.name}</h4>
                      <div className="search-result-card__price">
                        <span className="search-result-card__current">₹{product.price.toLocaleString('en-IN')}</span>
                        {product.compare_price && (
                          <span className="search-result-card__compare">₹{product.compare_price.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
