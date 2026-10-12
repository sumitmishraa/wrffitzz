import Link from 'next/link';
import Image from 'next/image';
import HeroParallax from '@/components/ui/HeroParallax';
import AtelierCraftsmanship from '@/components/AtelierCraftsmanship';
import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories } from '@/lib/api';
import Newsletter from '@/components/Newsletter';

export default async function HomePage() {
  const [allProducts, categories] = await Promise.all([
    getProducts({ limit: 20 }),
    getCategories(),
  ]);

  const bestsellers = allProducts.filter(p => p.is_bestseller).slice(0, 4);

  return (
    <>
      {/* 21st.dev Parallax Window Hero (Pure White Canvas, mix-blend-difference typography) */}
      <HeroParallax />

      {/* Trust & Promo Strip */}
      <section className="features-bar">
        <div className="container-fluid features-bar__inner">
          <div className="feature-item">
            <span className="feature-item__icon">🚚</span>
            <div className="feature-item__content">
              <strong>FREE DELIVERY</strong>
              <span>On prepaid orders above ₹1,999</span>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-item__icon">🏷️</span>
            <div className="feature-item__content">
              <strong>10% PREPAID OFF</strong>
              <span>Instant discount at checkout</span>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-item__icon">🔄</span>
            <div className="feature-item__content">
              <strong>15-DAY RETURNS</strong>
              <span>Hassle-free reverse pickup</span>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-item__icon">⭐</span>
            <div className="feature-item__content">
              <strong>100% GENUINE</strong>
              <span>Premium heavyweight fabrics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Category: Men & Women (Completely on the Right Side) */}
      <section className="categories-section">
        <div className="container-fluid">
          <div className="section-header text-right">
            <p className="section-header__subheading">DISCOVER</p>
            <h2 className="section-header__heading">SHOP BY CATEGORY</h2>
          </div>

          <div className="category-duo-grid">
            {/* Men's Category Card */}
            <Link href="/shop/men" className="category-duo-card category-duo-card--men">
              <div className="category-duo-card__img-wrap" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                  src="/images/categories/category-men.jpg"
                  alt="Shop Men's Streetwear Collection"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                  className="category-duo-card__img"
                />
              </div>
              <div className="category-duo-card__badge">STREETWEAR DROP &apos;26</div>
              <div className="category-duo-card__overlay">
                <span className="category-duo-card__label">THE MEN&apos;S EDIT</span>
                <h3 className="category-duo-card__title">MEN</h3>
                <p className="category-duo-card__desc">
                  Artisanal Shirts, Tailored Pleated Trousers &amp; Flannels
                </p>
                <span className="category-duo-card__cta">
                  <span>EXPLORE MEN&apos;S DROP</span>
                  <span className="cta-arrow">→</span>
                </span>
              </div>
            </Link>

            {/* Women's Category Card */}
            <Link href="/shop/women" className="category-duo-card category-duo-card--women">
              <div className="category-duo-card__img-wrap" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                  src="/images/categories/category-women.jpg"
                  alt="Shop Women's Streetwear Collection"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                  className="category-duo-card__img"
                />
              </div>
              <div className="category-duo-card__badge">CONTEMPORARY ATELIER</div>
              <div className="category-duo-card__overlay">
                <span className="category-duo-card__label">THE WOMEN&apos;S EDIT</span>
                <h3 className="category-duo-card__title">WOMEN</h3>
                <p className="category-duo-card__desc">
                  Embroidered Dresses, Coordinated Sets &amp; Silhouettes
                </p>
                <span className="category-duo-card__cta">
                  <span>EXPLORE WOMEN&apos;S DROP</span>
                  <span className="cta-arrow">→</span>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* The Atelier Craftsmanship & Fabric Story (Replaces Mismatched Banner) */}
      <AtelierCraftsmanship />

      {/* Bestsellers Section */}
      <section className="bestsellers-section">
        <div className="container-fluid">
          <div className="bestsellers-header">
            <div className="bestsellers-header__left">
              <p className="bestsellers-header__sub">TRENDING NOW</p>
              <h2 className="bestsellers-header__title">BESTSELLERS</h2>
            </div>
            <Link href="/shop/best-seller" className="btn btn--outline">
              VIEW ALL →
            </Link>
          </div>

          <div className="sf-product-grid sf-product-grid--4col">
            {bestsellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* VIP Club / Newsletter */}
      <Newsletter />
    </>
  );
}
