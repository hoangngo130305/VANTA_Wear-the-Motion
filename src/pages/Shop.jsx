import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { totalStock } from '../api/products.js';
import ProductCard from '../components/ProductCard.jsx';
import Reveal from '../components/Reveal.jsx';
import { Empty } from '../components/ui/index.jsx';
import { money } from '../lib/utils.js';
import { pCategory, pColor, pDesc, pName } from '../i18n/helpers.js';
import { rich, t, tc } from '../i18n/index.js';

const SORTS = [
  ['featured', 'Featured'], ['new', 'Newest'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['rating', 'Top rated']
];
export const COLLECTIONS = [['new', 'New arrivals'], ['bestseller', 'Best sellers'], ['sale', 'On sale'], ['featured', 'Featured']];
export const AUDIENCE_LIST = [['men', 'Men'], ['women', 'Women'], ['unisex', 'Unisex']];
const PAGE = 9;
const isNew = p => Date.now() - p.createdAt < 14 * 86400000 || p.tags?.includes('new');

/** Catalog. Every filter lives in the URL (?cat=&for=&col=&q=&sort=…) so the header mega menu and product breadcrumbs can deep-link. */
export default function Shop() {
  const { products, categories, catById } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') || '';
  const cat = params.get('cat') || 'all';
  const aud = params.get('for') || 'all';
  const col = params.get('col') || 'all';
  const sort = params.get('sort') || 'featured';
  const inStock = params.get('stock') === '1';
  const onSale = params.get('sale') === '1';
  const maxPrice = Math.max(...products.map(p => p.price), 1);
  const pmax = Number(params.get('max')) || maxPrice;

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v === '' || v == null || v === 'all' || v === false) next.delete(k); else next.set(k, v === true ? '1' : v);
    setParams(next, { replace: true });
    setLimit(PAGE);
  };

  const list = useMemo(() => {
    let l = products.filter(p => (cat === 'all' || p.category === cat) && p.price <= pmax);
    if (aud !== 'all') l = l.filter(p => p.audience === aud || (p.audience === 'unisex' && aud !== 'unisex'));
    if (col === 'new') l = l.filter(isNew);
    if (col === 'bestseller') l = l.filter(p => p.tags?.includes('bestseller'));
    if (col === 'sale') l = l.filter(p => p.compareAt);
    if (col === 'featured') l = l.filter(p => p.featured);
    if (q) l = l.filter(p => (p.name + ' ' + pName(p) + ' ' + pCategory(p) + ' ' + (p.color || '') + ' ' + pColor(p) + ' ' + p.desc + ' ' + pDesc(p)).toLowerCase().includes(q.toLowerCase()));
    if (inStock) l = l.filter(p => totalStock(p) > 0);
    if (onSale) l = l.filter(p => p.compareAt);
    const by = {
      featured: (a, b) => (b.featured - a.featured) || (b.createdAt - a.createdAt),
      new: (a, b) => b.createdAt - a.createdAt,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating
    }[sort];
    return [...l].sort(by);
  }, [products, cat, aud, col, q, sort, pmax, inStock, onSale]);

  const counts = useMemo(() => Object.fromEntries(categories.map(c => [c.id, products.filter(p => p.category === c.id).length])), [categories, products]);
  const active = (cat !== 'all') + (aud !== 'all') + (col !== 'all') + !!q + inStock + onSale + (pmax < maxPrice);
  const curCat = catById[cat];
  const heading = q ? <>{t('Results for')}<br /><em>“{q}”</em></>
    : curCat ? rich(tc(curCat.name) + '\n*' + t('collection') + '*')
    : col !== 'all' ? rich(t(COLLECTIONS.find(c => c[0] === col)?.[1] || 'Shop') + '\n*' + t('now') + '*')
    : rich(t('Everything\nin *motion.*'));

  return (
    <main className="page">
      <div className="wrap">
        <Reveal as="p" className="eyebrow dark"><span className="n">05</span> {t('Shop')}{curCat && <> · {tc(curCat.name)}</>}{aud !== 'all' && <> · {t(AUDIENCE_LIST.find(a => a[0] === aud)?.[1] || aud)}</>}</Reveal>
        <Reveal as="h1" className="h2 page__title">{heading}</Reveal>

        <div className="shop__bar">
          <div className="chips" role="tablist" aria-label={t('Category')}>
            <button type="button" role="tab" aria-selected={cat === 'all'} className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => set('cat', 'all')}>{t('All')} <i>{products.length}</i></button>
            {categories.map(c => (
              <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={'chip' + (cat === c.id ? ' on' : '')} onClick={() => set('cat', c.id)}>{tc(c.name)} <i>{counts[c.id]}</i></button>
            ))}
          </div>
          <div className="shop__tools">
            <button type="button" className="chip chip--filter" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(o => !o)}>{t('Filters')}{active ? ` (${active})` : ''}</button>
            <label className="select"><span className="sr">{t('Sort by')}</span>
              <select value={sort} onChange={e => set('sort', e.target.value)}>{SORTS.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select>
            </label>
          </div>
        </div>

        <div className={'filters' + (filtersOpen || aud !== 'all' || col !== 'all' ? ' open' : '')}>
          <div className="filters__in">
            <label className="select"><span className="sr">{t('For')}</span>
              <select value={aud} onChange={e => set('for', e.target.value)}>
                <option value="all">{t('Everyone')}</option>{AUDIENCE_LIST.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}
              </select>
            </label>
            <label className="select"><span className="sr">{t('Collection')}</span>
              <select value={col} onChange={e => set('col', e.target.value)}>
                <option value="all">{t('All collections')}</option>{COLLECTIONS.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}
              </select>
            </label>
            <label className="range">{t('Max price')} <b>{money(pmax)}</b>
              <input type="range" min="20" max={maxPrice} step="1" value={pmax} onChange={e => set('max', +e.target.value >= maxPrice ? '' : e.target.value)} />
            </label>
            <label className="check"><input type="checkbox" checked={inStock} onChange={e => set('stock', e.target.checked)} /> {t('In stock only')}</label>
            <label className="check"><input type="checkbox" checked={onSale} onChange={e => set('sale', e.target.checked)} /> {t('On sale')}</label>
            {active > 0 && <button type="button" className="link" onClick={() => { setParams({}, { replace: true }); setLimit(PAGE); }}><span>{t('Clear all')}</span></button>}
          </div>
        </div>

        <p className="shop__count" aria-live="polite">{list.length === 1 ? t('1 product') : t('{n} products', { n: list.length })}</p>

        {list.length === 0 ? (
          <Empty title={t('No products match')} text={t('Try removing a filter or searching for something else.')} action={<button className="btn btn--ghost" type="button" onClick={() => setParams({}, { replace: true })}><span>{t('Reset filters')}</span></button>} />
        ) : (
          <>
            <div className="grid">{list.slice(0, limit).map((p, i) => <ProductCard key={p.id} product={p} index={i % PAGE} />)}</div>
            {limit < list.length && (
              <div className="center"><button className="btn btn--ghost" type="button" onClick={() => setLimit(l => l + PAGE)}><span>{t('Load more ({n})', { n: list.length - limit })}</span></button></div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
