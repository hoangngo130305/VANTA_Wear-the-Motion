import { useRef } from 'react';
import { useScroll } from '../hooks/useScroll.js';
import { clamp } from '../lib/utils.js';

export default function Progress() {
  const ref = useRef(null);
  useScroll(({ y }) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
  });
  return <div className="progress" ref={ref} aria-hidden="true" />;
}
