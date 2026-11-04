import { useEffect, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useInView, usePageHidden } from '../hooks/useInView.js';
import { asset, thumb } from '../data/catalog.js';
import { rich, t, tc } from '../i18n/index.js';
import { pName } from '../i18n/helpers.js';
import { money, pad2, wrapN } from '../lib/utils.js';
import Reveal from './Reveal.jsx';
import { ArrowLeft, ArrowRight } from './Icons.jsx';

// per-slot layout of the line-up: left %, scale, opacity, blur
const POS = { l: [5, 31, 47, 60, 71, 80], s: [1, 0.8, 0.67, 0.57, 0.49, 0.43], o: [1, 0.92, 0.72, 0.52, 0.36, 0.22], b: [0, 0, 0.6, 1.1, 1.6, 2.2] };
const POSM = { l: [18, 52, 68, 79, 87, 93], s: [1, 0.78, 0.64, 0.54, 0.46, 0.4], o: [1, 0.9, 0.7, 0.5, 0.34, 0.2], b: [0, 0, 0.6, 1, 1.5, 2] };

/** "Try the look" line-up. Looks (name, photo, products) are editable in Admin → Content → Runway. */
export default function Runway() {
  const { openQV, addToCart, showToast, openCart, couponCode, setCouponCode } = useStore();
  const { looks: LOOKS, content: { runway: copy } } = useCatalog();
  const boxRef = useRef(null), stageRef = useRef(null);
  const [cur, setCur] = useState(0);
  const [tick, setTick] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [hover, setHover] = useState(false);
  const inView = useInView(boxRef, { threshold: 0.35 });
  const hidden = usePageHidden();
  const paused = !inView || hover || hidden;
  const swipe = useRef({ x: null, swiped: false });

  useEffect(() => {
    const el = stageRef.current;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = i => {
    i = wrapN(i, LOOKS.length);
    if (i === cur) return;
    setCur(i); setTick(n => n + 1);
  };

  const look = LOOKS[Math.min(cur, LOOKS.length - 1)];
  const total = look.pieces.reduce((a, p) => a + p.price, 0);
  const P = narrow ? POSM : POS;

  const addLook = () => {
    // default size per piece: M / EU 42, or the first size still in stock
    const added = look.pieces.filter(p => {
      const pref = p.kind === 'g' ? 'M' : '42';
      const size = (p.stock[pref] > 0 && pref) || p.sizes.find(sz => p.stock[sz] > 0);
      return size ? addToCart(p, size, 1, { quiet: true }) : false;
    });
    if (!added.length) return;
    if (!couponCode) setCouponCode('LOOK10');
    showToast(<>
      <span className="tick">✓</span>
      <span>{t('{name} added · code LOOK10 (10% off) applied', { name: tc(look.name) })}</span>
      <button type="button" onClick={openCart}>{t('View bag')}</button>
    </>, 4200);
  };

  return (
    <section className="sec runway" id="runway">
      <div className="wrap">
        <header className="sec__head sec__head--row">
          <div>
            <Reveal as="p" className="eyebrow"><span className="n">03</span> {tc(copy.eyebrow)}</Reveal>
            <Reveal as="h2" className="h2">{rich(copy.title)}</Reveal>
          </div>
          <Reveal as="p" className="lede">{tc(copy.lede)}</Reveal>
        </header>

        <div className={'rw' + (paused ? ' is-paused' : '')} ref={boxRef} style={{ '--rwdur': '6s' }}>
          <div
            className="rw__stage"
            ref={stageRef}
            tabIndex={0}
            aria-label={t('Looks line-up. Use arrow keys or swipe to change look.')}
            data-cursor={t('Drag')}
            onKeyDown={e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); }}
            onPointerDown={e => { swipe.current.x = e.clientX; swipe.current.swiped = false; }}
            onPointerUp={e => {
              const sw = swipe.current;
              if (sw.x == null) return;
              const dx = e.clientX - sw.x; sw.x = null;
              if (Math.abs(dx) > 50) { sw.swiped = true; go(cur + (dx < 0 ? 1 : -1)); setTimeout(() => { sw.swiped = false; }, 50); }
            }}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
          >
            <div className="rw__floor" aria-hidden="true" />
            <div className="rw__actors">
              {LOOKS.map((l, i) => {
                const r = i - cur;
                const style = r < 0
                  ? { transform: 'scale(.9)', left: '-40%', opacity: 0, filter: 'blur(3px)', zIndex: 0, pointerEvents: 'none' }
                  : { left: P.l[Math.min(r, 5)] + '%', transform: `scale(${P.s[Math.min(r, 5)]})`, opacity: P.o[Math.min(r, 5)], filter: P.b[Math.min(r, 5)] ? `blur(${P.b[Math.min(r, 5)]}px)` : 'none', zIndex: 10 - r, pointerEvents: 'auto' };
                return (
                  <div key={i} className="ac" role="button" aria-label={t('Look {n}: {name}', { n: i + 1, name: tc(l.name) })} style={style}
                    onClick={() => { if (!swipe.current.swiped) go(i); }}>
                    <img src={asset(l.image)} alt={tc(l.name)} draggable="false" loading="lazy" />
                  </div>
                );
              })}
            </div>

            <div className="rw__ctrl">
              <button type="button" aria-label={t('Previous look')} onClick={() => go(cur - 1)}><ArrowLeft /></button>
              <div className="rw__segs" onAnimationEnd={e => { if (e.animationName === 'fill') go(cur + 1); }}>
                {LOOKS.map((l, k) => (
                  <button key={k} type="button" aria-label={tc(l.name)} className={(k === cur ? 'is-active' : '') + (k < cur ? ' is-done' : '')} onClick={() => go(k)}>
                    <i key={k === cur ? 'a' + tick : 'x'} />{pad2(k + 1)} {tc(l.name)}
                  </button>
                ))}
              </div>
              <button type="button" aria-label={t('Next look')} onClick={() => go(cur + 1)}><ArrowRight /></button>
            </div>
          </div>

          <aside className="rw__panel" aria-live="polite">
            <div className="rw__phead"><h3>{tc(look.name)}</h3><span>{t('{n} pieces', { n: look.pieces.length })}</span></div>
            <ul className="rw__list">
              {look.pieces.map((p, k) => (
                <li key={cur + p.id} style={{ '--k': k }}>
                  <div className="rw__th" role="button" tabIndex={0} aria-label={t('View {name}', { name: pName(p) })} onClick={() => openQV(p)} onKeyDown={e => { if (e.key === 'Enter') openQV(p); }}>
                    <b>{k + 1}</b><img src={thumb(p)} alt="" />
                  </div>
                  <div><h4>{pName(p)}</h4><p>{money(p.price)}</p></div>
                  <button className="rw__add" type="button" aria-label={t('Choose size for {name}', { name: pName(p) })} onClick={() => openQV(p)}>+</button>
                </li>
              ))}
            </ul>
            <div className="rw__foot">
              <div className="rw__sum">
                <div><b>{t('Complete the look')}</b><small>{t('Bundle all {n} and save 10%', { n: look.pieces.length })}</small></div>
                <div className="rw__tot"><s>{money(total)}</s><strong>{money(total * 0.9)}</strong></div>
              </div>
              <button className="btn btn--solid btn--block" type="button" onClick={addLook}><span>{t('Add full look to bag')}</span><ArrowRight /></button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
