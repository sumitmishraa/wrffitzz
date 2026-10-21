'use client';
import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

// Modal behaviour for drawers and dialogs: Escape closes, Tab stays inside,
// the rest of the page is inert and does not scroll, and focus goes back to
// whatever opened the dialog.
export default function useDialog(open, onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const panel = ref.current;
    if (!panel) return undefined;

    const opener = document.activeElement;
    const main = document.getElementById('main');
    const header = document.getElementById('cab');
    const footer = document.getElementById('pie');
    const outside = [main, header, footer].filter((el) => el && !el.contains(panel));
    outside.forEach((el) => el.setAttribute('inert', ''));

    // globals.css sets overflow on <html> with !important; only an inline !important overrides it.
    const root = document.documentElement;
    root.style.setProperty('overflow', 'hidden', 'important');

    const focusables = () => Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    const first = panel.querySelector('[data-autofocus]') || focusables()[0] || panel;
    first.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const head = list[0];
      const tail = list[list.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    panel.addEventListener('keydown', onKey);

    return () => {
      panel.removeEventListener('keydown', onKey);
      outside.forEach((el) => el.removeAttribute('inert'));
      root.style.removeProperty('overflow');
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return ref;
}
