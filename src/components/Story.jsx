import { useEffect, useMemo, useRef } from 'react';
import { useReveal } from '../hooks/useReveal.js';
import { useScroll } from '../hooks/useScroll.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { asset } from '../data/catalog.js';
import { tc } from '../i18n/index.js';
import { clamp, reduceMotion } from '../lib/utils.js';
import Reveal from './Reveal.jsx';

function Counter({ end, dec = 0, suffix = '', label }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1800;
      const f = now => {
        const k = clamp((now - t0) / dur, 0, 1);
        el.textContent = (end * (1 - Math.pow(1 - k, 4))).toFixed(dec) + suffix;
        if (k < 1) raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [end, dec, suffix]);
  return <div><b ref={ref}>0</b><span>{label}</span></div>;
}

function Photo({ cls, factor, photo }) {
  const ref = useRef(null);
  useReveal(ref);
  useScroll(() => {
    if (reduceMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) return;
    ref.current.style.transform = `translate3d(0,${((r.top + r.height / 2 - innerHeight / 2) * factor).toFixed(1)}px,0)`;
  });
  return (
    <figure ref={ref} className={'ph ' + cls}>
      <img src={asset(photo.image)} alt={tc(photo.alt)} loading="lazy" /><figcaption>{tc(photo.caption)}</figcaption>
    </figure>
  );
}

/** Manifesto + photos + counters. All editable in Admin → Content → Story. */
export default function Story() {
  const { content: { story } } = useCatalog();
  const big = useRef(null);
  const words = useRef([]);
  const list = useMemo(() => tc(story.text).trim().split(/\s+/), [story.text]);

  // words light up as the paragraph scrolls through the viewport
  useScroll(() => {
    const el = big.current;
    if (!el) return;
    const br = el.getBoundingClientRect();
    if (br.bottom < -100 || br.top > innerHeight) return;
    const p = clamp((innerHeight * 0.82 - br.top) / (br.height + innerHeight * 0.32), 0, 1);
    const n = Math.round(p * list.length * 1.04);
    words.current.forEach((w, i) => w && w.classList.toggle('on', i < n));
  });

  return (
    <section className="sec story" id="story">
      <div className="wrap">
        <Reveal as="p" className="eyebrow dark"><span className="n">04</span> {tc(story.eyebrow)}</Reveal>
        <h2 className="story__big" ref={big}>
          {list.map((w, i) => <span key={i}><span className="w" ref={el => { words.current[i] = el; }}>{w}</span>{' '}</span>)}
        </h2>
        <div className="story__photos">
          <Photo cls="ph--a" factor={-0.08} photo={story.photo1} />
          <Photo cls="ph--b" factor={0.1} photo={story.photo2} />
        </div>
        <div className="stats">
          {story.stats.map((s, i) => <Counter key={i} end={Number(s.value) || 0} dec={Number(s.decimals) || 0} suffix={s.suffix || ''} label={tc(s.label)} />)}
        </div>
      </div>
    </section>
  );
}
