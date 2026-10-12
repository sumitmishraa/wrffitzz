'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const slides = [
  {
    id: 1,
    tag: 'NEW COLLECTION ‘26',
    title: 'ARTISANAL STATEMENT',
    subtitle: 'Hand-embroidered geometric motifs in black and tan on premium woven long-staple cotton.',
    ctaText: 'EXPLORE SHIRTS',
    ctaLink: '/shop/shirts',
    secondaryCtaText: 'VIEW LOOKBOOK',
    secondaryCtaLink: '/shop',
    image: '/images/products/geometric-shirt-combo.jpg',
  },
  {
    id: 2,
    tag: 'TAILORED ESSENTIALS',
    title: 'THE MODERN TROUSER',
    subtitle: 'Impeccably tailored trousers with a clean straight-leg drape and all-day fluid comfort.',
    ctaText: 'SHOP TROUSERS',
    ctaLink: '/shop/trousers',
    secondaryCtaText: 'BESTSELLERS',
    secondaryCtaLink: '/shop/best-seller',
    image: '/images/products/dual-trousers.jpg',
  },
  {
    id: 3,
    tag: 'HERITAGE REIMAGINED',
    title: 'BRUSHED FLANNEL',
    subtitle: 'Bold navy and white checks crafted from ultra-soft cotton flannel with a relaxed streetwear silhouette.',
    ctaText: 'SHOP FLANNEL',
    ctaLink: '/shop/shirts',
    secondaryCtaText: 'ALL PIECES',
    secondaryCtaLink: '/shop',
    image: '/images/products/check-shirt-front.jpg',
  },
  {
    id: 4,
    tag: 'LIMITED EDITION',
    title: 'BLOOM SILHOUETTE',
    subtitle: 'Enchanting lilac-pink summer dress adorned with hand-embroidered floral hem detailing.',
    ctaText: 'EXPLORE DRESSES',
    ctaLink: '/shop/dresses',
    secondaryCtaText: 'NEW ARRIVALS',
    secondaryCtaLink: '/shop?new=true',
    image: '/images/products/pink-floral-dress.jpg',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const nextSlide = () => {
    setCurrent(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, current]);

  return (
    <section
      className="hero-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-slider__track">
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id}
              className={`hero-slide ${isActive ? 'hero-slide--active' : ''}`}
              aria-hidden={!isActive}
            >
              {/* Slide Background Image */}
              <div className="hero-slide__image-wrap">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="hero-slide__img"
                  style={{ objectFit: 'cover' }}
                />
                <div className="hero-slide__overlay" />
              </div>

              {/* Slide Content */}
              <div className="hero-slide__content-container container">
                <div className="hero-slide__content">
                  <span className="hero-slide__tag animate-fadeInUp">
                    {slide.tag}
                  </span>
                  <h1 className="hero-slide__title animate-fadeInUp">
                    {slide.title}
                  </h1>
                  <p className="hero-slide__subtitle animate-fadeInUp">
                    {slide.subtitle}
                  </p>
                  <div className="hero-slide__ctas animate-fadeInUp">
                    <Link href={slide.ctaLink} className="btn btn--primary btn--lg">
                      {slide.ctaText}
                    </Link>
                    <Link href={slide.secondaryCtaLink} className="btn btn--terracotta btn--lg">
                      {slide.secondaryCtaText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        className="hero-slider__arrow hero-slider__arrow--prev"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 448 512">
          <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 117.2c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </button>

      <button
        className="hero-slider__arrow hero-slider__arrow--next"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 448 512">
          <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 394.7c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
        </svg>
      </button>

      {/* Circular Timer Pagination Dots */}
      <div className="hero-slider__dots">
        {slides.map((_, index) => {
          const isActive = index === current;
          return (
            <button
              key={index}
              className={`hero-dot ${isActive ? 'hero-dot--active' : ''}`}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <svg width="34" height="34" viewBox="0 0 72 72">
                <circle
                  className="hero-dot__bg"
                  strokeWidth="6"
                  fill="none"
                  cx="36"
                  cy="36"
                  r="30"
                />
                {isActive && !isPaused && (
                  <circle
                    className="hero-dot__time"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    cx="36"
                    cy="36"
                    r="30"
                  />
                )}
              </svg>
              <span className="hero-dot__inner" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
