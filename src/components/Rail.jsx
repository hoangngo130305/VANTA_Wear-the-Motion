import { useEffect, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { useInView } from '../hooks/useInView.js';
import { gImg } from '../data/catalog.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { money, reduceMotion } from '../lib/utils.js';
import Reveal from './Reveal.jsx';
import { rich, t, tc } from '../i18n/index.js';
import { pName } from '../i18n/helpers.js';

/** The hanging rail: hover swings a piece open (side → front), click opens the 360° quick view. */
export default function Rail() {
  const { openQV, qv } = useStore();
  const { rail: GARMENTS, content: { rail: copy } } = useCatalog();
  const rackRef = useRef(null);
  const [hovered, setHovered] = useState(-1);
  const inView = useInView(rackRef, { threshold: 0.4 });

  // refs mirror state for the auto-demo timer (no re-subscribing every render)
  const live = useRef({ inside: false, inView: false, lastUser: 0, demo: -1, qv: false });
  live.current.inView = inView;
  live.current.qv = !!qv;

  const set = (i, user) => {
    if (user) live.current.lastUser = performance.now();
    setHovered(i);
  };

  // gentle auto-demo so touch users and first-time visitors see the swing
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      const L = live.current;
      if (!L.inView || L.inside || L.qv || performance.now() - L.lastUser < 2600 || document.activeElement?.classList.contains('rk')) return;
      L.demo = (L.demo + 1) % (GARMENTS.length + 1);
      setHovered(L.demo >= GARMENTS.length ? -1 : L.demo);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const tagMargin = (g, active) => `calc(var(--h)*${(g.rs * (active ? -0.08 : 0.2)).toFixed(3)})`;
  const sel = hovered >= 0 ? GARMENTS[hovered] : null;

  return (
    <section className="sec rail" id="rail">
      <div className="wrap">
        <header className="sec__head">
          <Reveal as="p" className="eyebrow dark"><span className="n">01</span> {tc(copy.eyebrow)}</Reveal>
          <Reveal as="h2" className="h2">{rich(copy.title)}</Reveal>
          <Reveal as="p" className="lede">{tc(copy.lede)}</Reveal>
        </header>
      </div>

      <div
        className="rack"
        ref={rackRef}
        onPointerEnter={e => { if (e.pointerType === 'mouse') live.current.inside = true; }}
        onPointerLeave={e => { if (e.pointerType === 'mouse') live.current.inside = false; }}
      >
        <div className="rack__rod" aria-hidden="true" />
        <div className="rack__row" role="list">
          {GARMENTS.map((g, i) => (
            <div
              key={g.id}
              className={'rk' + (hovered === i ? ' is-hover' : '')}
              role="listitem"
              tabIndex={0}
              aria-label={`${pName(g)}, ${money(g.price)}`}
              data-cursor={t("View")}
              style={{ '--rs': g.rs, '--rf': g.rf, '--dl': `${-(i * 0.9).toFixed(2)}s`, '--dur': `${(4.4 + i * 0.35).toFixed(2)}s` }}
              onPointerEnter={e => { if (e.pointerType === 'mouse') { live.current.inside = true; set(i, true); } }}
              onPointerLeave={e => { if (e.pointerType === 'mouse') set(-1, true); }}
              onFocus={() => set(i, true)}
              onBlur={() => setHovered(-1)}
              onClick={() => { live.current.lastUser = performance.now(); openQV(g); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openQV(g); } }}
            >
              <div className="rk__sway">
                <div className="rk__turn">
                  <div className="rk__v rk__v--side"><img src={gImg(g, 'side')} alt={`${pName(g)} — ${t("side")}`} draggable="false" loading="lazy" /></div>
                  <div className="rk__v rk__v--front"><img src={gImg(g, 'front')} alt={`${pName(g)} — ${t("front")}`} draggable="false" loading="lazy" /></div>
                </div>
                <div className="rk__tag" style={{ left: '50%', right: 'auto', marginLeft: tagMargin(g, hovered === i) }}><b>{money(g.price)}</b></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rack__cap" aria-live="polite">
        {sel ? (
          <span className="rack__sel" key={sel.id}><b>{pName(sel)}</b><em>{money(sel.price)}</em></span>
        ) : (
          <span className="rack__hint"><i />{t('Hover a piece · click to look closer')}</span>
        )}
      </div>
    </section>
  );
}
