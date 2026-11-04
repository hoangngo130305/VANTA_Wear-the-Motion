import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { useScroll } from '../hooks/useScroll.js';
import { SHOE_SIZES, sImg } from '../data/catalog.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { clamp, lerp, money, pad2, reduceMotion, wrapN } from '../lib/utils.js';
import Reveal from './Reveal.jsx';
import { t, tc } from '../i18n/index.js';
import { pDesc, pName } from '../i18n/helpers.js';
import SizePicker from './SizePicker.jsx';
import { ArrowLeft, ArrowRight, Rotate } from './Icons.jsx';

const STEP = 31;
export const SELECT_SHOE_EVENT = 'vanta:select-shoe';

/** Shoe wheel: drag, scroll sideways, arrow keys, or click a shoe. All motion runs on refs inside one rAF loop. */
export default function Orbit() {
  const { openQV, addToCart, overlayRef } = useStore();
  const { shoes: SHOES, content: { orbit: copy } } = useCatalog();
  const N = SHOES.length;
  const Nref = useRef(N);
  Nref.current = N;
  const [active, setActive] = useState(2);
  const [size, setSize] = useState(null);
  const [shake, setShake] = useState(0);

  const secRef = useRef(null), stageRef = useRef(null), wordRef = useRef(null);
  const ring1 = useRef(null), ring2 = useRef(null);
  const els = useRef([]), spins = useRef([]);
  const m = useRef({ pos: 2, target: 2, drag: false, vel: 0, moved: 0, lx: 0, W: 0, H: 0, vis: false, active: 2 });

  /* position every shoe on the wheel for the current (fractional) pos */
  const layout = useCallback(() => {
    const S = m.current;
    const N = Nref.current;
    const narrow = S.W < 700;
    const R = narrow ? Math.max(S.H * 1.3, S.W * 0.8) : Math.max(S.H * 1.15, S.W * 0.56);
    const first = els.current[0];
    if (!first || !S.W) return;
    const hh = first.offsetWidth / 2;
    const y0 = S.H * (narrow ? 0.34 : 0.27);
    if (ring1.current) { ring1.current.style.top = (y0 + R) + 'px'; ring1.current.style.width = (R * 2) + 'px'; }
    if (ring2.current) { ring2.current.style.top = (y0 + R) + 'px'; ring2.current.style.width = (R * 1.72) + 'px'; }
    els.current.forEach((e, i) => {
      if (!e) return;
      const d = wrapN(i - S.pos + N / 2, N) - N / 2;
      const a = d * STEP, rad = a * Math.PI / 180, ad = Math.abs(d);
      const x = R * Math.sin(rad), y = y0 + R * (1 - Math.cos(rad));
      const sc = ad < 1 ? lerp(1.12, 0.5, ad) : ad < 2 ? lerp(0.5, 0.36, ad - 1) : 0.36;
      const op = ad < 1 ? lerp(1, 0.62, ad) : ad < 2 ? lerp(0.62, 0.22, ad - 1) : clamp(0.22 - (ad - 2) * 0.22, 0, 0.22);
      e.style.transform = `translate3d(${x.toFixed(1)}px,${(y - hh / 2).toFixed(1)}px,0) rotate(${(a * 0.5 - (ad < 1 ? 5 * (1 - ad) : 0)).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      e.style.opacity = op.toFixed(3);
      e.style.zIndex = 20 - Math.round(ad * 4);
      e.style.pointerEvents = op < 0.2 ? 'none' : 'auto';
      e.classList.toggle('is-on', ad < 0.5);
    });
    const idx = wrapN(Math.round(S.pos), N);
    if (idx !== S.active) { S.active = idx; setActive(idx); setSize(null); }
  }, []);

  /* measure, visibility, main loop */
  useEffect(() => {
    const S = m.current, stage = stageRef.current;
    const measure = () => { const r = stage.getBoundingClientRect(); S.W = r.width; S.H = r.height; layout(); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    const io = new IntersectionObserver(([en]) => { S.vis = en.isIntersecting; }, { rootMargin: '200px' });
    io.observe(secRef.current);
    let raf = 0;
    const tick = () => {
      if (S.vis) {
        if (!S.drag) S.pos = Math.abs(S.target - S.pos) < 0.001 ? S.target : lerp(S.pos, S.target, 0.1);
        layout();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [layout]);

  /* horizontal wheel (needs a non-passive listener), keyboard, external "select shoe" events */
  useEffect(() => {
    const S = m.current, stage = stageRef.current;
    const wheel = e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 8) {
        e.preventDefault(); S.pos += e.deltaX / 400; S.target = Math.round(S.pos);
      }
    };
    const key = e => {
      if (overlayRef.current || e.target.matches?.('input')) return;
      const r = secRef.current.getBoundingClientRect();
      if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) {
        if (e.key === 'ArrowRight') S.target = Math.round(S.target) + 1;
        if (e.key === 'ArrowLeft') S.target = Math.round(S.target) - 1;
      }
    };
    const select = e => {
      const N = Nref.current;
      const i = SHOES.findIndex(s => s.id === e.detail);
      if (i >= 0) S.target = Math.round(S.pos) + (wrapN(i - S.active + N / 2, N) - N / 2);
    };
    stage.addEventListener('wheel', wheel, { passive: false });
    document.addEventListener('keydown', key);
    window.addEventListener(SELECT_SHOE_EVENT, select);
    return () => {
      stage.removeEventListener('wheel', wheel);
      document.removeEventListener('keydown', key);
      window.removeEventListener(SELECT_SHOE_EVENT, select);
    };
  }, [overlayRef]);

  /* giant background word drifts sideways with scroll */
  useScroll(() => {
    const w = wordRef.current;
    if (!w) return;
    const r = secRef.current.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      w.style.transform = `translate(calc(-50% + ${((r.top + r.height / 2 - innerHeight / 2) * -0.25).toFixed(1)}px),-50%)`;
    }
  });

  const step = d => { m.current.target = Math.round(m.current.target) + d; };
  const spinShoe = () => {
    if (reduceMotion) return;
    spins.current[m.current.active]?.animate(
      [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg) scale(1.06)' }, { transform: 'rotateY(720deg)' }],
      { duration: 1500, easing: 'cubic-bezier(.65,0,.2,1)' }
    );
  };

  /* pointer: drag spins the wheel; a tap (no movement) selects / spins the shoe under the finger */
  const onDown = e => {
    const S = m.current;
    S.drag = true; S.moved = 0; S.lx = e.clientX; S.vel = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = e => {
    const S = m.current, stage = stageRef.current;
    const r = stage.getBoundingClientRect();
    stage.style.setProperty('--tx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
    stage.style.setProperty('--ty', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
    if (!S.drag) return;
    const dx = e.clientX - S.lx; S.lx = e.clientX; S.moved += Math.abs(dx);
    const dp = -dx / 170; S.pos += dp; S.target = S.pos; S.vel = dp;
  };
  const onUp = e => {
    const S = m.current;
    const N = Nref.current;
    if (!S.drag) return;
    S.drag = false;
    if (S.moved <= 6) {
      const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('.os');
      if (hit) {
        const i = +hit.dataset.i;
        const d = wrapN(i - Math.round(S.pos) + N / 2, N) - N / 2;
        if (Math.abs(d) < 0.5) spinShoe(); else S.target = Math.round(S.pos) + d;
      }
      S.target = Math.round(S.target);
    } else {
      S.target = Math.round(S.pos + S.vel * 7);
    }
  };

  const trackClick = e => {
    const N = Nref.current;
    const S = m.current, r = e.currentTarget.getBoundingClientRect();
    const i = clamp(Math.floor((e.clientX - r.left) / r.width * N), 0, N - 1);
    S.target = Math.round(S.pos) + (wrapN(i - S.active + N / 2, N) - N / 2);
  };

  const s = SHOES[Math.min(active, N - 1)];
  const add = () => {
    if (!size) { setShake(k => k + 1); return; }
    addToCart(s, size);
  };

  return (
    <section className="sec orbit" id="orbit" ref={secRef} style={{ backgroundColor: s.tint }}>
      <div className="orbit__bgword" aria-hidden="true" ref={wordRef}>{t("ORBIT")}</div>
      <div className="wrap orbit__top">
        <Reveal as="p" className="eyebrow dark"><span className="n">02</span> {tc(copy.eyebrow)}</Reveal>
      </div>

      <div className="orbit__grid">
        <div className="orbit__info">
          <p className="orbit__idx swapin" key={'i' + active}><b>{pad2(active + 1)}</b> / <span>{pad2(N)}</span></p>
          <h2 className="orbit__name swapin" key={'n' + active}>{pName(s)}</h2>
          <p className="orbit__price swapin" key={'p' + active}>{money(s.price)}</p>
          <p className="orbit__desc swapin" key={'d' + active}>{pDesc(s)}</p>
          <button className="link" type="button" data-cursor={t("Open")} onClick={() => openQV(s)}><span>{t("View details")}</span><ArrowRight /></button>
        </div>

        <div className="orbit__stage" ref={stageRef} data-cursor={t("Drag")} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="orbit__ring" ref={ring1} /><div className="orbit__ring r2" ref={ring2} />
          <div className="orbit__shoes">
            {SHOES.map((sh, i) => (
              <div key={sh.id} className="os" data-i={i} role="button" aria-label={pName(sh)} ref={el => { els.current[i] = el; }}>
                <div className="os__spin" ref={el => { spins.current[i] = el; }}>
                  <img src={sImg(sh)} alt={pName(sh)} draggable="false" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="orbit__buy">
          <p className="label">{t("EU size")}</p>
          <SizePicker sizes={SHOE_SIZES} stock={s.stock} value={size} onChange={setSize} shakeKey={shake} label={t("Shoe size")} />
          <button className="btn btn--solid btn--block" type="button" onClick={add}><span>{size ? t('Add to bag — {price}', { price: money(s.price) }) : t('Select a size')}</span></button>
          <button className="btn btn--ghost btn--block" type="button" onClick={spinShoe}><span>{t("Spin 360°")}</span><Rotate /></button>
        </div>
      </div>

      <div className="orbit__ctrl wrap">
        <button type="button" aria-label={t("Previous shoe")} onClick={() => step(-1)}><ArrowLeft /></button>
        <div className="orbit__track" onClick={trackClick}>
          <i style={{ left: (active / N * 100) + '%', transition: 'left .6s cubic-bezier(.16,1,.3,1)' }} />
          <span>{t("Drag the wheel · scroll · arrow keys")}</span>
        </div>
        <button type="button" aria-label={t("Next shoe")} onClick={() => step(1)}><ArrowRight /></button>
      </div>
    </section>
  );
}
