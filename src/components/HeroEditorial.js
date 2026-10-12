'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HeroEditorial() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="hero-editorial">
      <div className="container-fluid hero-editorial__container">
        {/* Top Editorial Label Bar */}
        <div className="hero-editorial__topbar">
          <div className="hero-editorial__tagline">
            <span className="hero-editorial__live-dot" />
            <span>ARCHIVAL STREETWEAR · BENGALURU CAPSULE &apos;26</span>
          </div>
          <div className="hero-editorial__monogram">WF<span className="dot">.</span></div>
        </div>

        <div className="hero-editorial__grid">
          {/* Left Column: Typography & Barcode (Image 2 Editorial Poster Layout) */}
          <div className="hero-editorial__left">
            <div className="hero-editorial__header-group">
              <span className="hero-editorial__kicker">NEW ATELIER DROP</span>
              <h1 className="hero-editorial__title">
                MODERN <br />
                <span className="hero-editorial__title-italic">STREETWEAR</span>
              </h1>
            </div>

            {/* Blue Highlight Text Strips (Faithful recreation from Image 2 reference) */}
            <div className="hero-editorial__highlight-block">
              <div className="highlight-pill">
                <span>Heavyweight long-staple fabrics engineered for urban life</span>
              </div>
              <div className="highlight-pill">
                <span>Relaxed contemporary proportions with artisanal embroidery</span>
              </div>
              <div className="highlight-pill">
                <span>Handcrafted in Bangalore for everyday confidence and form</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="hero-editorial__actions">
              <Link href="/shop" className="hero-editorial__cta">
                <span className="cta-text">EXPLORE THE DROP</span>
                <span className="cta-arrow">→</span>
              </Link>
              <Link href="/shop/best-seller" className="hero-editorial__secondary-cta">
                VIEW BESTSELLERS
              </Link>
            </div>

            {/* Bottom Barcode Graphic (Image 2 detail) */}
            <div className="hero-editorial__barcode-wrap">
              <div className="barcode-svg">
                <svg width="180" height="42" viewBox="0 0 180 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Realistic Barcode Stripes */}
                  <rect x="0" y="0" width="3" height="34" fill="#111111" />
                  <rect x="5" y="0" width="2" height="34" fill="#111111" />
                  <rect x="9" y="0" width="4" height="34" fill="#111111" />
                  <rect x="16" y="0" width="1" height="34" fill="#111111" />
                  <rect x="20" y="0" width="5" height="34" fill="#111111" />
                  <rect x="28" y="0" width="2" height="34" fill="#111111" />
                  <rect x="33" y="0" width="3" height="34" fill="#111111" />
                  <rect x="39" y="0" width="1" height="34" fill="#111111" />
                  <rect x="43" y="0" width="6" height="34" fill="#111111" />
                  <rect x="52" y="0" width="2" height="34" fill="#111111" />
                  <rect x="57" y="0" width="4" height="34" fill="#111111" />
                  <rect x="64" y="0" width="1" height="34" fill="#111111" />
                  <rect x="68" y="0" width="3" height="34" fill="#111111" />
                  <rect x="74" y="0" width="5" height="34" fill="#111111" />
                  <rect x="82" y="0" width="2" height="34" fill="#111111" />
                  <rect x="87" y="0" width="4" height="34" fill="#111111" />
                  <rect x="94" y="0" width="2" height="34" fill="#111111" />
                  <rect x="99" y="0" width="5" height="34" fill="#111111" />
                  <rect x="107" y="0" width="1" height="34" fill="#111111" />
                  <rect x="111" y="0" width="3" height="34" fill="#111111" />
                  <rect x="117" y="0" width="4" height="34" fill="#111111" />
                  <rect x="124" y="0" width="2" height="34" fill="#111111" />
                  <rect x="129" y="0" width="6" height="34" fill="#111111" />
                  <rect x="138" y="0" width="1" height="34" fill="#111111" />
                  <rect x="142" y="0" width="3" height="34" fill="#111111" />
                  <rect x="148" y="0" width="5" height="34" fill="#111111" />
                  <rect x="156" y="0" width="2" height="34" fill="#111111" />
                  <rect x="161" y="0" width="4" height="34" fill="#111111" />
                  <rect x="168" y="0" width="2" height="34" fill="#111111" />
                  <rect x="173" y="0" width="5" height="34" fill="#111111" />
                </svg>
                <div className="barcode-shimmer" />
              </div>
              <span className="barcode-url">WWW.WRFITZZ.COM</span>
            </div>
          </div>

          {/* Right Column: Visual Composition with Male & Female Models + Motion Graphics */}
          <div
            className="hero-editorial__visual"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Background Graphic Layers */}
            <div className="visual-graphic visual-graphic--circle-blue" />
            <div className="visual-graphic visual-graphic--swirl-contour" />
            <div className="visual-graphic visual-graphic--accent-dot" />

            {/* Kinetic Floating Badges */}
            <div className="hero-editorial__floating-badge hero-editorial__floating-badge--stamp">
              <span className="stamp-label">BASIC ELEMENTS</span>
              <span className="stamp-title">NEW COLLECTION &apos;26</span>
            </div>

            <div className="hero-editorial__floating-badge hero-editorial__floating-badge--capsule">
              <span className="capsule-icon">⚡</span>
              <span>BANGALORE ATELIER</span>
            </div>

            {/* Main AI Editorial Studio Photograph (Male and Female models in brand garments) */}
            <div className={`hero-editorial__model-frame ${isHovered ? 'is-hovered' : ''}`}>
              <Image
                src="/images/hero-editorial-models.jpg"
                alt="wrfitzz Modern Streetwear Male and Female Models"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                style={{ objectFit: 'cover' }}
                className="hero-editorial__img"
              />
              <div className="hero-editorial__model-overlay" />
            </div>

            {/* Editorial Technical Micro-Copy (Image 2 style) */}
            <div className="hero-editorial__microcopy">
              <p>
                Wrfitzz Archival Edition: 320 GSM combed organic cotton, precision double-stitch seams, tailored modern drapery for high longevity.
              </p>
            </div>

            {/* Vertical Running Editorial Text (Image 2 style) */}
            <div className="hero-editorial__vertical-text">
              <span>INTERNATIONAL STREETWEAR RUNWAY · BENGALURU 2026 · WRFITZZ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
