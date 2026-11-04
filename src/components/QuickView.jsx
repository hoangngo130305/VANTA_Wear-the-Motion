import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useTurntable } from '../hooks/useTurntable.js';
import Turntable, { modeOf } from './Turntable.jsx';
import ProductInfo from './ProductInfo.jsx';
import { ArrowRight, Close } from './Icons.jsx';
import { t } from '../i18n/index.js';

/** Modal wrapper: mounts on open, plays the enter transition, keeps the DOM until the exit transition ends. */
export default function QuickView() {
  const { qv, closeQV } = useStore();
  const [shown, setShown] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (qv) {
      setShown(qv);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setOpen(true)); });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }
    setOpen(false);
    const t = setTimeout(() => setShown(null), 600);
    return () => clearTimeout(t);
  }, [qv]);

  if (!shown) return null;
  return <QuickViewBody product={shown} open={open} onClose={closeQV} />;
}

function QuickViewBody({ product, open, onClose }) {
  const tt = useTurntable(modeOf(product), product.id);
  const closeBtn = useRef(null);

  // focus handling: move focus in, give it back on close
  useEffect(() => {
    const prev = document.activeElement;
    const t = setTimeout(() => closeBtn.current?.focus({ preventScroll: true }), 50);
    return () => { clearTimeout(t); prev?.focus?.({ preventScroll: true }); };
  }, []);

  return (
    <div className={'qv' + (open ? ' open' : '')} role="dialog" aria-modal="true" aria-labelledby="qvName">
      <div className="qv__bd" onClick={onClose} />
      <div className="qv__box">
        <button className="qv__x" type="button" aria-label={t("Close")} ref={closeBtn} onClick={onClose}><span>{t("Close")}</span><Close /></button>
        <Turntable product={product} tt={tt} />
        <ProductInfo
          product={product}
          tt={tt}
          onAdded={onClose}
          footer={<Link className="link" to={`/product/${product.id}`} onClick={onClose} style={{ marginTop: 18, alignSelf: 'flex-start' }}><span>{t("Full details")}</span><ArrowRight /></Link>}
        />
      </div>
    </div>
  );
}
