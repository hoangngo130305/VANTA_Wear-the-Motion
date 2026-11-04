import { useEffect } from 'react';

/** Adds the `in` class once the element scrolls into view (CSS does the animation). */
export function useReveal(ref, { threshold = 0.15, rootMargin = '0px 0px -6% 0px' } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      el.classList.add('in');
      io.disconnect();
    }, { threshold, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, rootMargin]);
}
