export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const wrapN = (v, n) => ((v % n) + n) % n;
export { money } from '../i18n/index.js';
export const pad2 = n => String(n).padStart(2, '0');

const mq = q => (typeof matchMedia === 'function' ? matchMedia(q).matches : false);
export const reduceMotion = mq('(prefers-reduced-motion: reduce)');
export const finePointer = mq('(hover:hover) and (pointer:fine)');

/** Vite base ('./') so assets resolve from any sub-path. */
export const BASE = import.meta.env.BASE_URL;

/** restart a CSS animation on an element without remounting it */
export function restartAnimation(el, prop = 'animation') {
  if (!el) return;
  el.style[prop] = 'none';
  void el.offsetWidth;
  el.style[prop] = '';
}
