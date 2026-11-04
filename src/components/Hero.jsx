import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useGoto } from '../hooks/useGoto.js';
import { useInView, usePageHidden } from '../hooks/useInView.js';
import { asset, sImg } from '../data/catalog.js';
import { rich, t, tc } from '../i18n/index.js';
import { pName } from '../i18n/helpers.js';
import { finePointer, lerp, money, pad2, reduceMotion, wrapN } from '../lib/utils.js';
import { ArrowLeft, ArrowRight, ArrowUpRight } from './Icons.jsx';

const DUR = 5.5;

/** Home banner. Slides, headline, buttons and images are all editable in Admin → Content → Hero banner. */
export default function Hero({ started }) {
  const { openQV } = useStore();
  const { scenes: SCENES, byId, content: { hero } } = useCatalog();
  const goto = useGoto();
  const navigate = useNavigate();
  const heroRef = useRef(null), stageRef = useRef(null);
  const [cur, setCur] = useState(-1);
  const [prev, setPrev] = useState(-1);
  const [tick, setTick] = useState(0);       // bumps on every slide change → restarts the progress bars
  const inView = useInView(heroRef, { threshold: 0.25 });
  const hidden = usePageHidden();
  const paused = !inView || hidden;
  const slideImg = s => (s.image ? asset(s.image) : sImg(byId[s.product]));

  // random sparkles, generated once
  const [sparks] = useState(() => Array.from({ length: 16 }, () => ({
    left: Math.random() * 100, top: 20 + Math.random() * 70,
    s: 8 + Math.random() * 18, t: 4 + Math.random() * 5, dl: -Math.random() * 6
  })));

  const go = useCallback(i => {
    i = wrapN(i, SCENES.length);
    if (i === cur) return;
    setPrev(cur); setCur(i); setTick(n => n + 1);
  }, [cur, SCENES.length]);

  // first slide starts when the preloader has left
  useEffect(() => { if (started && cur < 0) go(0); }, [started, cur, go]);

  // the outgoing slide keeps its "is-prev" state until the exit transition is done
  useEffect(() => {
    if (prev < 0) return;
    const timer = setTimeout(() => setPrev(-1), 1500);
    return () => clearTimeout(timer);
  }, [prev, cur]);

  // header text colour follows the slide
  const scene = SCENES[Math.min(Math.max(cur, 0), SCENES.length - 1)];
  useEffect(() => {
    document.documentElement.style.setProperty('--hero-fg', cur >= 0 ? scene.fg : '#fff');
  }, [cur, scene.fg]);

  // preload the other slides
  useEffect(() => { SCENES.forEach(s => { const im = new Image(); im.src = slideImg(s); }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // mouse parallax (CSS reads --mx/--my)
  useEffect(() => {
    if (!finePointer || reduceMotion) return;
    const el = heroRef.current, stage = stageRef.current;
    let tx = 0, ty = 0, mx = 0, my = 0, raf = 0;
    const move = e => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 2 - 1; ty = (e.clientY - r.top) / r.height * 2 - 1;
    };
    const leave = () => { tx = ty = 0; };
    const frame = () => {
      mx = lerp(mx, tx, 0.07); my = lerp(my, ty, 0.07);
      stage.style.setProperty('--mx', mx.toFixed(3)); stage.style.setProperty('--my', my.toFixed(3));
      raf = requestAnimationFrame(frame);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(frame);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, []);

  const heroStyle = { '--dur': DUR + 's' };
  if (cur >= 0) { heroStyle['--fg'] = scene.fg; heroStyle['--hc'] = scene.fg; }
  const sh = byId[scene.product];
  const stateOf = k => (k === cur ? ' is-active' : '') + (k === prev && k !== cur ? ' is-prev' : '');
  const open = link => e => { e.preventDefault(); if (link.startsWith('/')) navigate(link); else goto(link); };

  return (
    <section
      ref={heroRef}
      className={'hero' + (scene.dark && cur >= 0 ? ' is-dark-fg' : '') + (paused ? ' is-paused' : '')}
      id="hero"
      style={heroStyle}
      aria-roledescription="carousel"
      aria-label={t('Featured drops')}
      onKeyDown={e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); }}
    >
      <div className="hero__bgs">
        {SCENES.map((s, k) => <div key={k} className={'hbg' + stateOf(k)} style={{ '--c': s.bg, '--cx': s.cx, '--cy': s.cy }} />)}
      </div>
      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__spark" aria-hidden="true">
        {sparks.map((p, i) => (
          <span key={i} style={{ left: p.left + '%', top: p.top + '%', '--s': p.s + 'px', '--t': p.t + 's', '--dl': p.dl + 's' }}>✦</span>
        ))}
      </div>

      <div className="hero__stage" ref={stageRef}>
        {SCENES.map((s, k) => {
          const p = byId[s.product];
          return (
            <div key={k} className={'sc' + stateOf(k)}>
              <div className="sc__word" aria-hidden="true">
                {[...s.word].map((c, i) => <span key={i} style={{ '--i': i }}>{c}</span>)}
              </div>
              <div className="sc__shoe" style={{ pointerEvents: 'none' }}>
                <div className="sc__shoe-in"><div className="sc__shoe-fl">
                  <img src={slideImg(s)} alt={pName(p)} draggable="false" fetchPriority={k === 0 ? 'high' : undefined} />
                  <div className="sc__shadow" />
                  {s.hotspots.map((h, i) => (
                    <div key={i} className="hs" style={{ left: h.x + '%', top: h.y + '%' }}><i /><b>{tc(h.text)}</b></div>
                  ))}
                </div></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hero__copy">
        <p className="eyebrow"><span className="dot" /><span>{tc(scene.tag)}</span></p>
        <h1 className="hero__h1" aria-label={tc(hero.line1) + ' ' + tc(hero.line2).replace(/\*/g, '')}>
          <span className="ln"><span>{rich(hero.line1)}</span></span>
          <span className="ln"><span>{rich(hero.line2)}</span></span>
        </h1>
        <div className="hero__cta">
          <a className="btn btn--solid" href="#/" data-cursor={t('Go')} onClick={open(hero.cta1.link)}>
            <span>{tc(hero.cta1.label)}</span><ArrowRight />
          </a>
          <a className="btn btn--ghost" href="#/" data-cursor={t('Go')} onClick={open(hero.cta2.link)}>
            <span>{tc(hero.cta2.label)}</span>
          </a>
        </div>
      </div>

      <aside key={cur} className={'hero__card' + (cur >= 0 ? ' swap' : '')} aria-live="polite">
        <div className="hero__card-top"><span>{pad2(Math.max(cur, 0) + 1)}</span><span>/ {pad2(SCENES.length)}</span></div>
        <strong>{pName(sh)}</strong>
        <span>{money(sh.price)}</span>
        <button className="hero__card-btn" type="button" data-cursor={t('Quick view')} onClick={() => openQV(sh)}>
          {t('Quick view')} <ArrowUpRight />
        </button>
      </aside>

      <div
        className="hero__nav"
        role="tablist"
        aria-label={t('Choose drop')}
        onAnimationEnd={e => { if (e.animationName === 'fill' && e.target.parentElement?.classList.contains('is-active')) go(cur + 1); }}
      >
        {SCENES.map((s, k) => {
          const n = pName(byId[s.product]);
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-label={n}
              aria-selected={k === cur}
              className={(k === cur ? 'is-active' : '') + (k < cur ? ' is-done' : '')}
              onClick={() => go(k)}
            >
              <i key={k === cur ? 'a' + tick : 'x'} />
              <span>{pad2(k + 1)} {n}</span>
            </button>
          );
        })}
      </div>
      <div className="hero__arrows">
        <button type="button" aria-label={t('Previous drop')} onClick={() => go(cur - 1)}><ArrowLeft /></button>
        <button type="button" aria-label={t('Next drop')} onClick={() => go(cur + 1)}><ArrowRight /></button>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <svg viewBox="0 0 120 120"><defs><path id="circ" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs><text><textPath href="#circ">{t('SCROLL · EXPLORE · SCROLL · EXPLORE ·')}</textPath></text></svg>
        <b>↓</b>
      </div>
    </section>
  );
}
