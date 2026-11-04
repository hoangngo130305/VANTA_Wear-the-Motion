import { useEffect, useRef } from 'react';
import { lerp } from '../lib/utils.js';
import { cImg } from '../data/catalog.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { BASE } from '../lib/utils.js';
import { t } from '../i18n/index.js';

/** Counts up while the first hero images load, then slides away (CSS handles the slide via body.is-loading). */
export default function Preloader({ onDone }) {
  const brandName = useCatalog().content.brand.name;
  const num = useRef(null), bar = useRef(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let ready = false, n = 0, raf = 0;
    const t0 = performance.now();
    const srcs = [`${BASE}img/s/shoe-7.webp`, `${BASE}img/s/shoe-1.webp`, cImg('rod')];
    Promise.all(srcs.map(src => new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = src; })))
      .then(() => { ready = true; });

    const tick = now => {
      const el = now - t0;
      n = lerp(n, ready ? 100 : Math.min(88, el / 12), 0.12);
      if (ready && n > 99) n = 100;
      if (num.current) num.current.textContent = Math.round(n);
      if (bar.current) bar.current.style.width = n + '%';
      if ((n >= 100 && el > 900) || el > 6000) { done.current(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pre" aria-hidden="true">
      <div className="pre__word">{brandName}</div>
      <div className="pre__count"><span ref={num}>0</span>%</div>
      <div className="pre__bar"><i ref={bar} /></div>
    </div>
  );
}
