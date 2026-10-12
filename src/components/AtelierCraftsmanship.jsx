import Link from 'next/link';
import Image from 'next/image';

export default function AtelierCraftsmanship() {
  return (
    <section className="atelier-craftsmanship">
      <div className="container-fluid atelier-craftsmanship__container">
        {/* Section Header */}
        <div className="atelier-craftsmanship__header">
          <div className="atelier-craftsmanship__header-left">
            <span className="atelier-craftsmanship__eyebrow">
              <span className="dot" /> THE ATELIER MANIFESTO
            </span>
            <h2 className="atelier-craftsmanship__title">
              HONEST WEIGHT.<br />
              UNCOMPROMISED DRAPE.
            </h2>
          </div>
          <div className="atelier-craftsmanship__header-right">
            <p className="atelier-craftsmanship__lead">
              Every wrfitzz piece is an intentional dialogue between heavyweight natural fibers, 
              tactile artisanal needlework, and relaxed modern proportions engineered for longevity.
            </p>
            <div className="atelier-craftsmanship__quick-specs">
              <span className="spec-tag">🌿 100% Organic Fibers</span>
              <span className="spec-tag">⚡ Pre-Washed &amp; Preshrunk</span>
              <span className="spec-tag">📍 Bangalore Atelier</span>
            </div>
          </div>
        </div>

        {/* 3 Core Craftsmanship Pillars */}
        <div className="atelier-pillars-grid">
          {/* Pillar 1 */}
          <div className="atelier-pillar-card">
            <div className="atelier-pillar-card__top">
              <span className="pillar-metric">320 GSM</span>
              <span className="pillar-num">01</span>
            </div>
            <h3 className="pillar-title">Substantial Pure Weave</h3>
            <p className="pillar-desc">
              Crafted from long-staple combed cotton with dense woven yarns. Delivers a weighted, 
              flowing drape that never clings, holding crisp architectural lines all day.
            </p>
            <div className="pillar-feature-list">
              <span>✓ High-density twill weave</span>
              <span>✓ Breathable thermal regulation</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="atelier-pillar-card atelier-pillar-card--highlight">
            <div className="atelier-pillar-card__top">
              <span className="pillar-metric pillar-metric--gold">ARTISAN</span>
              <span className="pillar-num">02</span>
            </div>
            <h3 className="pillar-title">Tactile Geometric Embroidery</h3>
            <p className="pillar-desc">
              Subtle monochrome and tan pixel-inspired embroidery hand-stitched into chest pockets, 
              plackets, and cuffs. Elevating casual streetwear into archival statement wear.
            </p>
            <div className="pillar-feature-list">
              <span>✓ Thread-dyed reinforced yarns</span>
              <span>✓ Limited numbered capsule runs</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="atelier-pillar-card">
            <div className="atelier-pillar-card__top">
              <span className="pillar-metric">TAILORED</span>
              <span className="pillar-num">03</span>
            </div>
            <h3 className="pillar-title">Contemporary Proportions</h3>
            <p className="pillar-desc">
              Relaxed shoulders, fluid straight-leg drops, and micro-pleated waists. 
              Balanced proportions that move effortlessly between smart-casual and relaxed streetwear.
            </p>
            <div className="pillar-feature-list">
              <span>✓ Double-needle flat-felled seams</span>
              <span>✓ Guaranteed shrink-resistant form</span>
            </div>
          </div>
        </div>

        {/* Footer CTA & Reassurance Strip */}
        <div className="atelier-craftsmanship__footer">
          <div className="atelier-craftsmanship__brand-badge">
            <span className="pulse-dot" />
            <span>EST. 2026 · CRAFTED WITH PASSION IN BENGALURU, INDIA</span>
          </div>

          <div className="atelier-craftsmanship__actions">
            <Link href="/shop" className="btn btn--primary btn--lg">
              EXPLORE ATELIER COLLECTION →
            </Link>
            <Link href="/shop/best-seller" className="btn btn--outline btn--lg">
              VIEW BESTSELLERS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
