/* Scroll: Lenis (suavizado en desktop) sincronizado con GSAP ScrollTrigger.
   En touch o con movimiento reducido se usa el scroll nativo. */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { motion } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;
const listeners = new Set();

export function initScroll() {
  history.scrollRestoration = 'manual';
  if (!motion.reduced && !motion.touch) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false, autoRaf: false });
    lenis.on('scroll', () => { ScrollTrigger.update(); emit(); });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener('scroll', emit, { passive: true });
  }
}

function emit() { for (const fn of listeners) fn(); }
export function onScroll(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function scrollY() { return lenis ? lenis.scroll : window.scrollY; }
export function isScrolling() { return lenis ? lenis.isScrolling : false; }

/* Lleva el scroll a `y`. immediate = salto sin animación. */
export function scrollTo(y, { immediate = false, duration = 1.15, onComplete } = {}) {
  const target = Math.max(0, Math.round(y));
  if (lenis) {
    lenis.scrollTo(target, {
      immediate, duration, force: true, lock: !immediate,
      easing: (t) => 1 - Math.pow(1 - t, 3.2),
      onComplete,
    });
  } else {
    window.scrollTo({ top: target, behavior: 'instant' });
    ScrollTrigger.update();
    emit();
    onComplete?.();
  }
}

export function stopScroll() { lenis?.stop(); }
export function startScroll() { lenis?.start(); }
export function resizeScroll() { lenis?.resize(); }
export { gsap, ScrollTrigger };
