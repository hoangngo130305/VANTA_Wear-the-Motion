import { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, wrapN } from '../lib/utils.js';

/** the four stacked faces of a garment: front, side, back, side mirrored */
export const ANGLES = [
  { a: 0, v: 'front', m: 1 },
  { a: 90, v: 'side', m: 1 },
  { a: 180, v: 'back', m: 1 },
  { a: 270, v: 'side', m: -1 }
];

/**
 * 360° product viewer. Garments cross-fade between their four faces while being
 * squashed like a turntable; shoes use a real rotateY. All per-frame work is done
 * on refs (no React re-render while dragging).
 */
export function useTurntable(kind, itemId) {
  const spinRef = useRef(null);
  const layers = useRef([]);
  const st = useRef({ theta: 0, vel: 0, drag: null, tween: 0, raf: 0 });
  const [view, setView] = useState(0);
  const [hintHidden, setHintHidden] = useState(false);

  const render = useCallback(() => {
    const spin = spinRef.current;
    if (!spin) return;
    const { theta } = st.current;
    if (kind === 'g') {
      for (let i = 0; i < 4; i++) {
        const l = layers.current[i];
        if (!l) continue;
        const d = Math.abs(wrapN(theta - ANGLES[i].a + 180, 360) - 180);
        l.style.opacity = d <= 41 ? 1 : d >= 49 ? 0 : 1 - (d - 41) / 8;
      }
      const local = wrapN(theta + 45, 90) - 45;
      spin.style.transform = `scaleX(${(0.56 + 0.44 * Math.cos(local * Math.PI / 90)).toFixed(3)})`;
    } else {
      spin.style.transform = `rotateY(${theta}deg)`;
    }
  }, [kind]);

  const animateTo = useCallback((target, dur = 900) => {
    const s = st.current;
    cancelAnimationFrame(s.tween);
    const from = s.theta;
    const delta = wrapN(target - s.theta + 180, 360) - 180;
    const t0 = performance.now();
    s.vel = 0;
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1);
      s.theta = from + delta * (1 - Math.pow(1 - t, 4));
      render();
      if (t < 1) s.tween = requestAnimationFrame(step);
    };
    s.tween = requestAnimationFrame(step);
  }, [render]);

  // intro spin + inertia loop
  useEffect(() => {
    const s = st.current;
    s.theta = -200; s.vel = 0; s.drag = null;
    render();
    animateTo(0, 1500);
    setView(0); setHintHidden(false);
    const loop = () => {
      if (!s.drag && Math.abs(s.vel) > 0.02) { s.theta += s.vel; s.vel *= 0.95; render(); }
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(s.raf); cancelAnimationFrame(s.tween); };
  }, [kind, itemId, render, animateTo]);

  const goTo = useCallback(a => { animateTo(a); setView(a); setHintHidden(true); }, [animateTo]);

  const mediaProps = {
    onPointerDown: e => {
      const s = st.current;
      cancelAnimationFrame(s.tween);
      s.drag = { x: e.clientX }; s.vel = 0;
      e.currentTarget.setPointerCapture(e.pointerId);
      setHintHidden(true);
    },
    onPointerMove: e => {
      const s = st.current;
      if (!s.drag) return;
      const dx = e.clientX - s.drag.x;
      s.drag.x = e.clientX;
      s.theta -= dx * 0.6; s.vel = -dx * 0.6;
      render(); setView(-1);
    },
    onPointerUp: () => { st.current.drag = null; },
    onPointerCancel: () => { st.current.drag = null; }
  };

  return { spinRef, layers, mediaProps, view, hintHidden, goTo };
}
