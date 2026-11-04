import { useEffect, useMemo, useRef } from 'react';
import { useScroll } from '../hooks/useScroll.js';
import { clamp, reduceMotion } from '../lib/utils.js';

/** Endless marquee; speed and skew follow the scroll velocity. dir: 1 = left, -1 = right. */
export default function Ticker({ words, dir = 1, dark = false }) {
  const rowRef = useRef(null);
  const s = useRef({ x: 0, half: 0 });

  // group = word ✦ outlined-word ✦ …; repeated an even number of times so the second half repeats the first exactly
  const nodes = useMemo(() => {
    const reps = words.length >= 4 ? 2 : 4;
    return Array.from({ length: reps }, (_, r) => words.flatMap((w, i) => [
      <span key={`${r}w${i}`} className={i % 2 ? 'o' : undefined}>{w}</span>,
      <i key={`${r}s${i}`}>✦</i>
    ]));
  }, [words]);

  useEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      if (!row) return;
      const c = row.children;
      s.current.half = c[c.length / 2].offsetLeft - c[0].offsetLeft;
      if (dir < 0 && !s.current.x) s.current.x = -s.current.half;
    };
    measure();
    addEventListener('resize', measure);
    addEventListener('load', measure);
    document.fonts?.ready.then(measure);
    return () => { removeEventListener('resize', measure); removeEventListener('load', measure); };
  }, [dir]);

  useScroll(({ vel }) => {
    const row = rowRef.current;
    if (!row) return;
    const rect = row.parentElement.getBoundingClientRect();
    if (rect.bottom < -50 || rect.top > innerHeight + 50) return;
    const st = s.current;
    st.x -= dir * (reduceMotion ? 0 : 1.1 + Math.abs(vel) * 0.5);
    if (st.half) { if (st.x <= -st.half) st.x += st.half; if (st.x > 0) st.x -= st.half; }
    row.style.transform = `translate3d(${st.x}px,0,0) skewX(${clamp(-vel * 0.35 * dir, -8, 8)}deg)`;
  });

  return (
    <section className={'ticker' + (dark ? ' ticker--dark' : '')} aria-hidden="true">
      <div className="ticker__row" ref={rowRef}>{nodes}</div>
    </section>
  );
}
