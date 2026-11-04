import { useEffect, useRef } from 'react';
import { subscribeScroll } from '../lib/scrollStore.js';

/** Run `cb({y, dy, vel})` every frame while the component is mounted (shared rAF loop). */
export function useScroll(cb) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => subscribeScroll(s => ref.current(s)), []);
}
