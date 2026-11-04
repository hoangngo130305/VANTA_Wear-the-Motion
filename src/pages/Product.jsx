import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useTurntable } from '../hooks/useTurntable.js';
import Turntable, { modeOf } from '../components/Turntable.jsx';
import ProductInfo from '../components/ProductInfo.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Reviews from '../components/Reviews.jsx';
import Reveal from '../components/Reveal.jsx';
import { Breadcrumbs } from '../components/ui/index.jsx';
import { pCategory, pName } from '../i18n/helpers.js';
import { t, tc, rich } from '../i18n/index.js';

const RECENT = 'vanta-recent';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT)) || []; } catch { return []; } };

export default function Product() {
  const { id } = useParams();
  const { byId } = useCatalog();
  const p = byId[id];
  if (!p) return <Navigate to="/shop" replace />;
  return <ProductPage key={p.id} product={p} />;
}

function ProductPage({ product }) {
  const { products, byId, content } = useCatalog();
  const tt = useTurntable(modeOf(product), product.id);
  const [recent, setRecent] = useState([]);

  // "recently viewed": remember this one, show the others
  useEffect(() => {
    const ids = readRecent();
    setRecent(ids.filter(i => i !== product.id));
    try { localStorage.setItem(RECENT, JSON.stringify([product.id, ...ids.filter(i => i !== product.id)].slice(0, 8))); } catch { /* ignore */ }
    document.title = `${pName(product)} — ${content.brand.name}`;
    return () => { document.title = tc(content.seo.title).replace('{brand}', content.brand.name); };
  }, [product.id, product.name]);

  const related = products.filter(x => x.category === product.category && x.id !== product.id).concat(products.filter(x => x.category !== product.category && x.kind === product.kind && x.id !== product.id)).slice(0, 4);
  const seen = recent.map(i => byId[i]).filter(Boolean).slice(0, 4);

  return (
    <main className="page">
      <div className="wrap">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: pCategory(product), to: `/shop?cat=${product.category}` }, { label: pName(product) }]} />
        <div className="pdp">
          <Turntable product={product} tt={tt} className="pdp__media" />
          <ProductInfo product={product} tt={tt} extended />
        </div>

        <Reviews product={product} />

        {related.length > 0 && <>
          <Reveal as="h2" className="h2 related__title">{rich(t('You may\n*also like*'))}</Reveal>
          <div className="grid">{related.map((r, i) => <ProductCard key={r.id} product={r} index={i} />)}</div>
        </>}

        {seen.length > 0 && <>
          <Reveal as="h2" className="h2 related__title">{rich(t('Recently\n*viewed*'))}</Reveal>
          <div className="grid">{seen.map((r, i) => <ProductCard key={r.id} product={r} index={i} quick={false} />)}</div>
        </>}
      </div>
    </main>
  );
}
