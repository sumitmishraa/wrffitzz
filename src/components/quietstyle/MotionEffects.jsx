'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const REVEAL = '.split:not(.vista), .rev:not(.vista), .mask:not(.vista)';

// Page-level motion from the QuietStyle reference (epica.js, epica2.js):
// reading progress bar, reveal-on-scroll for headings/blocks/cards, and
// magnetic buttons on mouse devices. Everything is skipped with reduced motion.
export default function MotionEffects() {
  const pathname = usePathname();
  const barRef = useRef(null);

  // Reading progress
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    let pending = false;
    const measure = () => {
      pending = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--prog', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
    };
    const request = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(measure);
      }
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    measure();
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
  }, [pathname]);

  // Reveal on scroll (re-scans on navigation and when lists re-render)
  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const main = document.getElementById('main');
    if (!main) return undefined;
    if (still || !('IntersectionObserver' in window)) {
      main.querySelectorAll(REVEAL).forEach((el) => el.classList.add('vista'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vista');
          io.unobserve(entry.target);
        }
      }),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    const observeAll = () => main.querySelectorAll(REVEAL).forEach((el) => io.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  // Magnetic buttons: the button leans a little towards the cursor
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || still) return undefined;
    let current = null;
    const reset = (el) => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    };
    const onMove = (e) => {
      const el = e.target.closest?.('.boton, .cab__boton');
      if (current && current !== el) reset(current);
      current = el;
      if (!el || el.disabled) return;
      const r = el.getBoundingClientRect();
      const dx = Math.max(-10, Math.min(10, (e.clientX - (r.left + r.width / 2)) * 0.28));
      const dy = Math.max(-8, Math.min(8, (e.clientY - (r.top + r.height / 2)) * 0.28));
      el.style.setProperty('--mx', `${dx.toFixed(1)}px`);
      el.style.setProperty('--my', `${dy.toFixed(1)}px`);
    };
    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <div className="progreso" aria-hidden="true" ref={barRef} />;
}
