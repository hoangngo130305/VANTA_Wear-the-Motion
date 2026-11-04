import { useEffect, useRef } from 'react';
import { finePointer, lerp, reduceMotion } from '../lib/utils.js';

/** Lime follower. Label comes from the nearest [data-cursor] ancestor. */
export default function Cursor({ resetKey, off = false }) {
  const c = useRef(null), lab = useRef(null);
  const enabled = finePointer && !reduceMotion && !off;

  useEffect(() => {
    if (!enabled) return;
    const el = c.current, label = lab.current;
    document.documentElement.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0;

    const move = e => {
      x = e.clientX; y = e.clientY;
      el.classList.add('is-on');
      const t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      const l = t ? t.dataset.cursor : '';
      el.classList.toggle('is-label', !!l);
      label.textContent = l;
      el.classList.toggle('is-link', !l && !!(e.target.closest && e.target.closest('a,button,input,[role=button]')));
    };
    const leave = () => el.classList.remove('is-on');
    const frame = () => {
      cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
      el.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      raf = requestAnimationFrame(frame);
    };
    addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(frame);
    return () => {
      removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
    };
  }, [enabled]);

  // a modal opening under a stationary pointer must not keep the old label
  useEffect(() => {
    if (!enabled) return;
    c.current?.classList.remove('is-label', 'is-link');
    if (lab.current) lab.current.textContent = '';
  }, [resetKey, enabled]);

  return <div className="cursor" ref={c} aria-hidden="true"><span ref={lab} /></div>;
}
