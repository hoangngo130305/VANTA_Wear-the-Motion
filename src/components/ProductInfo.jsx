import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GARMENT_SIZES, SHOE_SIZES } from '../data/catalog.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { money, pad2 } from '../lib/utils.js';
import SizePicker from './SizePicker.jsx';
import SizeGuide from './SizeGuide.jsx';
import { Accordion, Badge, Stars } from './ui/index.jsx';
import { VIEWS, modeOf } from './Turntable.jsx';
import HeartButton from './HeartButton.jsx';
import { pCategory, pColor, pDesc, pName } from '../i18n/helpers.js';
import { t } from '../i18n/index.js';

const DETAILS = [
  { q: 'Details & care', a: 'Oversized, boxy fit. Machine wash cold inside out, tumble dry low, do not bleach. Colours may vary slightly between screens.' },
  { q: 'Shipping', a: 'Free standard shipping on orders over {free}. Standard 2–4 working days, express next-day in major cities.' },
  { q: 'Returns', a: '30 days, unworn with tags. Start a return from your order page and we send a prepaid label.' }
];

/** Right-hand column shared by the quick-view modal and the product page. */
export default function ProductInfo({ product, tt, onAdded, footer, extended = false }) {
  const { addToCart } = useStore();
  const { products, settings } = useCatalog();
  const { requireLogin } = useAuth();
  const navigate = useNavigate();
  const [size, setSize] = useState(null);
  const [shake, setShake] = useState(0);
  const [guide, setGuide] = useState(false);
  const isG = product.kind === 'g';
  const list = products.filter(p => p.kind === product.kind);
  const left = size ? product.stock[size] ?? 0 : null;
  const soldOut = Object.values(product.stock).every(n => n <= 0);

  const add = () => {
    if (!size) { setShake(k => k + 1); return false; }
    const ok = addToCart(product, size);
    if (ok) onAdded?.();
    return ok;
  };
  const buyNow = () => { if (add()) { if (requireLogin('checkout')) navigate('/checkout'); } };

  return (
    <div className="qv__info">
      <p className="qv__idx">{pad2(list.findIndex(p => p.id === product.id) + 1)} / {pad2(list.length)} · {extended ? <Link className="qv__cat" to={`/shop?cat=${product.category}`}>{pCategory(product)}</Link> : <span className="qv__cat">{pCategory(product)}</span>}{pColor(product) && isG ? ` · ${pColor(product)}` : ''}</p>
      <div className="pi__title">
        <h3 id="qvName">{pName(product)}</h3>
        {extended && <HeartButton productId={product.id} />}
      </div>
      <div className="pi__price">
        <p className="qv__price">{money(product.price)}</p>
        {product.compareAt && <s>{money(product.compareAt)}</s>}
        {product.compareAt && <Badge tone="accent">-{Math.round((1 - product.price / product.compareAt) * 100)}%</Badge>}
        {product.reviewCount > 0 && <span className="pi__rating"><Stars value={product.rating} size={14} /><small>({product.reviewCount})</small></span>}
      </div>
      <p className="qv__desc">{pDesc(product)}</p>
      <div className="qv__views">
        {VIEWS[modeOf(product)].map(([label, a]) => (
          <button key={a} type="button" className={tt.view === a ? 'on' : ''} onClick={() => tt.goTo(a)}>{t(label)}</button>
        ))}
      </div>
      <div className="pi__sizehead">
        <p className="label">{isG ? t('Size') : t('EU size')}</p>
        <button type="button" className="pi__guide" onClick={() => setGuide(true)}>{t("Size guide")}</button>
      </div>
      <SizePicker sizes={isG ? GARMENT_SIZES : SHOE_SIZES} stock={product.stock} value={size} onChange={setSize} shakeKey={shake} label={t("Size")} />
      <p className={'pi__stock' + (left !== null && left <= 3 ? ' low' : '')} aria-live="polite">
        {soldOut ? t('Sold out') : left === null ? t('Select a size to see availability') : left <= 3 ? t('Only {n} left — selling fast', { n: left }) : t('In stock · ships in 24h')}
      </p>
      <button className="btn btn--solid btn--block" type="button" disabled={soldOut} onClick={add}>
        <span>{soldOut ? t('Sold out') : size ? t('Add to bag — {price}', { price: money(product.price) }) : t('Select a size')}</span>
      </button>
      {extended && !soldOut && <button className="btn btn--ghost btn--block" type="button" onClick={buyNow}><span>{t("Buy it now")}</span></button>}
      {extended && <Accordion items={DETAILS.map(d => ({ q: t(d.q), a: t(d.a, { free: money(settings.freeShippingFrom) }) }))} defaultOpen={0} />}
      {footer}
      <SizeGuide open={guide} onClose={() => setGuide(false)} kind={product.kind} />
    </div>
  );
}
