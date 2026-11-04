import { Link } from 'react-router-dom';
import { gImg, thumb } from '../data/catalog.js';
import { money } from '../lib/utils.js';
import { totalStock } from '../api/products.js';
import { useStore } from '../context/StoreContext.jsx';
import HeartButton from './HeartButton.jsx';
import { pCategory, pName } from '../i18n/helpers.js';
import { Badge, Stars } from './ui/index.jsx';
import { t } from '../i18n/index.js';

const isNew = p => Date.now() - p.createdAt < 14 * 86400000 || p.tags?.includes('new');

export default function ProductCard({ product: p, index = 0, quick = true }) {
  const { openQV } = useStore();
  const stock = totalStock(p);
  const badge = stock <= 0 ? <Badge tone="dark">{t("Sold out")}</Badge>
    : p.compareAt ? <Badge tone="accent">{t("Sale")}</Badge>
    : stock <= 6 ? <Badge tone="warn">{t("Low stock")}</Badge>
    : isNew(p) ? <Badge tone="lime">{t("New")}</Badge> : null;

  return (
    <article className={'card card--' + p.kind + (stock <= 0 ? ' card--out' : '')} style={{ '--i': index }}>
      <Link to={`/product/${p.id}`} className="card__img" data-cursor={t("View")} aria-label={pName(p)}>
        <img src={thumb(p)} alt={pName(p)} loading="lazy" draggable="false" />
        {p.views && <img className="card__alt" src={gImg(p, 'back')} alt="" loading="lazy" draggable="false" />}
      </Link>
      <div className="card__badges">{badge}</div>
      <HeartButton productId={p.id} className="card__heart" />
      <div className="card__meta">
        <div>
          <h3><Link to={`/product/${p.id}`}>{pName(p)}</Link></h3>
          <small>{pCategory(p)}</small>
          {p.reviewCount > 0 && <span className="card__rate"><Stars value={p.rating} size={12} /><small>{p.rating.toFixed(1)}</small></span>}
        </div>
        <div className="card__price"><b>{money(p.price)}</b>{p.compareAt && <s>{money(p.compareAt)}</s>}</div>
      </div>
      {quick && stock > 0 && <button type="button" className="card__quick" onClick={() => openQV(p)}>{t("Quick view")}</button>}
    </article>
  );
}
