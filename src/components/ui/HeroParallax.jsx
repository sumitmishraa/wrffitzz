'use client';
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

export default function HeroParallax() {
  const container = useRef(null);
  const [activeHotspot, setActiveHotspot] = useState(null);

  const { scrollYProgress } = useScroll({
    offset: ["start end", "end start"],
    target: container,
  });

  // Smooth scroll parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "12%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.0]);

  return (
    <section className="parallax-hero-wrapper">
      <div
        className="parallax-hero-container"
        ref={container}
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* Parallax Content Layer */}
        <div className="parallax-hero-content">
          {/* Top Bar with Quote */}
          <div className="parallax-hero-top-row">
            <div className="parallax-hero-brand-mark">
              <span className="brand-season-mark">WRF // 2026</span>
            </div>

            {/* Top Right Quote */}
            <motion.div
              className="parallax-hero-quote-wrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            >
              <p className="parallax-hero-quote">
                Beauty and quality need the right time to be conceived and realised
                even in a world that is in too much of a hurry.
              </p>
            </motion.div>
          </div>

          {/* Interactive Lookbook Motion Hotspots */}
          <div className="hero-hotspots-layer">
            {/* Hotspot 1: Female Model Tailored Blazer */}
            <div
              className="hero-hotspot hero-hotspot--blazer"
              onMouseEnter={() => setActiveHotspot('blazer')}
              onMouseLeave={() => setActiveHotspot(null)}
            >
              <button
                type="button"
                className="hero-hotspot__trigger"
                onClick={() => setActiveHotspot(activeHotspot === 'blazer' ? null : 'blazer')}
                aria-label="View Atelier Tailored Blazer Details"
              >
                <span className="hero-hotspot__ping" />
                <span className="hero-hotspot__center" />
              </button>

              <AnimatePresence>
                {activeHotspot === 'blazer' && (
                  <motion.div
                    className="hero-hotspot__card"
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="hero-hotspot__tag">EDITION 01</div>
                    <h4 className="hero-hotspot__title">Atelier Charcoal Blazer</h4>
                    <p className="hero-hotspot__spec">Tailored Structured Cut · Noir Charcoal</p>
                    <div className="hero-hotspot__bottom">
                      <span className="hero-hotspot__price">₹2,999</span>
                      <Link href="/shop/shirts" className="hero-hotspot__link">
                        EXPLORE →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hotspot 2: Male Model Geometric Knit & Trouser */}
            <div
              className="hero-hotspot hero-hotspot--trouser"
              onMouseEnter={() => setActiveHotspot('trouser')}
              onMouseLeave={() => setActiveHotspot(null)}
            >
              <button
                type="button"
                className="hero-hotspot__trigger"
                onClick={() => setActiveHotspot(activeHotspot === 'trouser' ? null : 'trouser')}
                aria-label="View Geometric Paneled Knit Details"
              >
                <span className="hero-hotspot__ping" />
                <span className="hero-hotspot__center" />
              </button>

              <AnimatePresence>
                {activeHotspot === 'trouser' && (
                  <motion.div
                    className="hero-hotspot__card"
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="hero-hotspot__tag">EDITION 02</div>
                    <h4 className="hero-hotspot__title">Geometric Paneled Knit</h4>
                    <p className="hero-hotspot__spec">Dual-Tone Architecture · Slate Gabardine</p>
                    <div className="hero-hotspot__bottom">
                      <span className="hero-hotspot__price">₹2,499</span>
                      <Link href="/shop/trousers" className="hero-hotspot__link">
                        EXPLORE →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Display Headline & CTAs */}
          <div className="parallax-hero-bottom">
            <motion.div
              className="parallax-hero-title-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            >
              <div className="hero-title-meta-strip">
                <span className="parallax-hero-eyebrow">
                  BANGALORE ATELIER · CAPSULE &apos;26
                </span>
                <span className="hero-title-meta-sep">/</span>
                <span className="hero-title-meta-tag">LIMITED RUN 100 PIECES</span>
              </div>

              <h1 className="parallax-hero-title">
                WRFITZZ ARCHIVAL
              </h1>
            </motion.div>

            {/* Public Interactive CTAs (Admin strictly removed) */}
            <motion.div
              className="parallax-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
            >
              <Link href="/shop" className="parallax-hero-btn parallax-hero-btn--primary">
                <span>EXPLORE CAPSULE</span>
                <span className="arrow">→</span>
              </Link>
              <Link href="/shop/best-seller" className="parallax-hero-btn parallax-hero-btn--secondary">
                <span>VIEW BESTSELLERS</span>
              </Link>
            </motion.div>
          </div>

          {/* Architectural Minimalist Framing Crosshairs */}
          <div className="hero-frame-crosshair hero-frame-crosshair--tl">+</div>
          <div className="hero-frame-crosshair hero-frame-crosshair--tr">+</div>
          <div className="hero-frame-crosshair hero-frame-crosshair--bl">+</div>
          <div className="hero-frame-crosshair hero-frame-crosshair--br">+</div>
        </div>

        {/* Parallax Fixed Background Image Window */}
        <div className="parallax-hero-bg-fixed">
          <motion.div className="parallax-hero-motion-wrap" style={{ y, scale }}>
            <Image
              alt="wrfitzz Architectural Luxury Streetwear Campaign"
              fill
              priority
              unoptimized
              src="/images/hero-parallax-bg.jpg"
              style={{ objectFit: "cover", objectPosition: "center 12%" }}
              className="parallax-hero-img"
            />
            {/* Subtle luxury vignette & high-fashion atmospheric gradient overlay */}
            <div className="hero-cinematic-overlay" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
