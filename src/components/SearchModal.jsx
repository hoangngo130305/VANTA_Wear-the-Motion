import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { thumb } from '../data/catalog.js';
import { money } from '../lib/utils.js';
import { pCategory, pName } from '../i18n/helpers.js';
import { t } from '../i18n/index.js';

export default function SearchModal() {
  const { searchOpen, closeSearch } = useStore();
  const { products } = useCatalog();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const input = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;
    setQ('');
    const t = setTimeout(() => input.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [searchOpen]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter(p => !s || (p.name + ' ' + pName(p) + ' ' + (p.color || '') + ' ' + pCategory(p)).toLowerCase().includes(s))
      .slice(0, 8);
  }, [q, products]);

  if (!searchOpen) return null;

  const pick = p => { closeSearch(); navigate(`/product/${p.id}`); };
  const submit = e => {
    e.preventDefault();
    if (!q.trim()) return;
    closeSearch(); navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="search">
      <div className="search__bd" onClick={closeSearch} />
      <form className="search__box" role="dialog" aria-label={t("Search")} onSubmit={submit}>
        <input ref={input} type="search" placeholder={t("Search hoodies, sneakers, tees…  (Enter for all results)")} autoComplete="off" value={q} onChange={e => setQ(e.target.value)} />
        <ul>
          {results.length === 0 && <li className="none">{t('Nothing matches “{q}” yet.', { q })}</li>}
          {results.map(p => (
            <li key={p.id}>
              <button type="button" onClick={() => pick(p)}>
                <img src={thumb(p)} alt="" />
                <span><b>{pName(p)}</b><small>{pCategory(p)}</small></span>
                <em>{money(p.price)}</em>
              </button>
            </li>
          ))}
        </ul>
      </form>
    </div>
  );
}
