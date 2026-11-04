import { lerp } from './utils.js';

/**
 * One shared requestAnimationFrame loop for everything that reacts to scrolling
 * (header, progress bar, tickers, parallax, word reveal). It only runs while
 * at least one component is subscribed.
 */
const subs = new Set();
const state = { y: 0, dy: 0, vel: 0 };
let raf = 0, lastY = 0;

function loop() {
  const y = window.scrollY;
  state.dy = y - lastY;
  lastY = y;
  state.vel = lerp(state.vel, state.dy, 0.12);
  state.y = y;
  subs.forEach(fn => fn(state));
  raf = requestAnimationFrame(loop);
}

export function subscribeScroll(fn) {
  subs.add(fn);
  if (subs.size === 1) {
    lastY = window.scrollY;
    raf = requestAnimationFrame(loop);
  }
  return () => {
    subs.delete(fn);
    if (!subs.size) { cancelAnimationFrame(raf); raf = 0; }
  };
}
