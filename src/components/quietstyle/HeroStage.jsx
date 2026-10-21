'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

// Ported from the QuietStyle reference (ferra.js · volarMarca): over the first
// 30% of a screen the giant wordmark shrinks and flies into the header logo
// slot, then hides while the header shows its own logo (QuietHeader drops `hero`).
export default function HeroStage() {
  const introRef = useRef(null);
  const stageRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const intro = introRef.current;
    const stage = stageRef.current;
    const name = nameRef.current;
    if (!intro || !stage || !name) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let flight = null;
    let pending = false;

    const measure = () => {
      const logo = document.querySelector('#cab .logo__nombre');
      if (!logo) return null;
      const previous = name.style.transform;
      name.style.transform = 'none';
      const a = name.getBoundingClientRect();
      const b = logo.getBoundingClientRect();
      name.style.transform = previous;
      const scrolled = Math.max(0, -intro.getBoundingClientRect().top);
      return {
        dx: b.left + b.width / 2 - (a.left + a.width / 2),
        dy: b.top + b.height / 2 - (a.top + scrolled + a.height / 2),
        s: b.width / a.width,
      };
    };

    const update = () => {
      pending = false;
      const scrolled = Math.max(0, -intro.getBoundingClientRect().top);
      const pre = clamp(scrolled / (window.innerHeight * 0.3));
      stage.classList.toggle('en-portada', pre < 0.3);
      if (!flight) flight = measure();
      if (!flight) return;
      const e = smooth(pre);
      const done = pre >= 0.999;
      name.style.transform = `translate3d(${(flight.dx * e).toFixed(2)}px, ${(flight.dy * e + scrolled).toFixed(2)}px, 0) scale(${(1 - (1 - flight.s) * e).toFixed(4)})`;
      name.style.opacity = done ? '0' : '1';
    };

    const request = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    };
    const onResize = () => {
      flight = null;
      request();
    };

    // Fonts change the wordmark's width; measure again once they are in.
    document.fonts?.ready.then(onResize);
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', onResize);
    update();
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section className="intro" id="intro" aria-labelledby="intro-nombre" ref={introRef}>
      <div className="intro__stage en-portada" id="introStage" ref={stageRef}>
        <div className="intro__portada" aria-hidden="true">
          <Image src="/fotos/portada-atardecer.jpg" alt="" fill priority sizes="100vw" style={{ objectFit: 'cover' }} />
        </div>

        <div className="intro__drop">
          <p className="intro__drop-et">New drop</p>
          <p className="intro__drop-tit">Out now. Limited run.</p>
          <a className="intro__drop-btn" href="#estrellas">Shop the drop</a>
        </div>

        <h1 className="intro__nombre" id="intro-nombre" ref={nameRef}>
          wrfitzz<sup aria-hidden="true">®</sup>
        </h1>
      </div>
    </section>
  );
}
