'use client';
import { useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

export default function FeaturedCollection({ products }) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = products.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'shirts') return p.category?.slug === 'shirts' || p.category_id === 'cat-shirts';
    if (activeTab === 'trousers') return p.category?.slug === 'trousers' || p.category_id === 'cat-trousers';
    if (activeTab === 'dresses') return p.category?.slug === 'dresses' || p.category_id === 'cat-dresses';
    if (activeTab === 'bestsellers') return p.is_bestseller;
    return true;
  });

  const getHeading = () => {
    switch (activeTab) {
      case 'shirts': return 'SIGNATURE SHIRTS';
      case 'trousers': return 'TAILORED TROUSERS';
      case 'dresses': return 'SUMMER DRESSES';
      case 'bestsellers': return 'BESTSELLERS';
      default: return 'CURATED COLLECTION';
    }
  };

  return (
    <section className="featured-collection-section">
      <div className="container-fluid">
        {/* Section Header */}
        <div className="section-header text-center">
          <p className="section-header__subheading">SIGNATURE ATELIER</p>
          <h2 className="section-header__heading">{getHeading()}</h2>

          {/* Interactive Collection Switcher Tabs */}
          <div className="collection-tabs">
            <button
              className={`collection-tab ${activeTab === 'all' ? 'collection-tab--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Pieces
            </button>
            <button
              className={`collection-tab ${activeTab === 'shirts' ? 'collection-tab--active' : ''}`}
              onClick={() => setActiveTab('shirts')}
            >
              Shirts
            </button>
            <button
              className={`collection-tab ${activeTab === 'trousers' ? 'collection-tab--active' : ''}`}
              onClick={() => setActiveTab('trousers')}
            >
              Trousers
            </button>
            <button
              className={`collection-tab ${activeTab === 'dresses' ? 'collection-tab--active' : ''}`}
              onClick={() => setActiveTab('dresses')}
            >
              Dresses
            </button>
            <button
              className={`collection-tab ${activeTab === 'bestsellers' ? 'collection-tab--active' : ''}`}
              onClick={() => setActiveTab('bestsellers')}
            >
              Bestsellers
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="sf-product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All CTA */}
        <div className="featured-collection__footer">
          <Link
            href={
              activeTab === 'shirts'
                ? '/shop/shirts'
                : activeTab === 'trousers'
                ? '/shop/trousers'
                : activeTab === 'dresses'
                ? '/shop/dresses'
                : activeTab === 'bestsellers'
                ? '/shop/best-seller'
                : '/shop'
            }
            className="btn btn--outline btn--lg"
          >
            VIEW ALL {activeTab.toUpperCase()} ({filteredProducts.length})
          </Link>
        </div>
      </div>
    </section>
  );
}
