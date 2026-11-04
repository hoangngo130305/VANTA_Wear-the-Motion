import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { asset, thumb } from '../data/catalog.js';
import { money } from '../lib/utils.js';
import { t, tc } from '../i18n/index.js';
import { pName } from '../i18n/helpers.js';
import { ArrowRight } from './Icons.jsx';

/** Mega menu under "Shop": featured collections, footwear / apparel categories (from Admin → Categories), audience, and a promo tile. */
export default function ShopMenu({ open, onNavigate }) {
  const { categories, products } = useCatalog();
  const count = id => products.filter(p => p.category === id).length;
  const shoes = categories.filter(c => c.kind === 's');
  const apparel = categories.filter(c => c.kind === 'g');
  const promo = products.find(p => p.featured && p.compareAt) || products.find(p => p.tags?.includes('bestseller')) || products.find(p => p.featured) || products[0];
  const go = { onClick: onNavigate };

  return (
    <div className={'mega' + (open ? ' open' : '')} aria-hidden={!open}>
      <div className="mega__in">
        <div className="mega__col">
          <h4>{t('Featured')}</h4>
          <Link to="/shop?col=new" tabIndex={open ? 0 : -1} {...go}>{t('New arrivals')}</Link>
          <Link to="/shop?col=bestseller" tabIndex={open ? 0 : -1} {...go}>{t('Best sellers')}</Link>
          <Link to="/shop?col=sale" tabIndex={open ? 0 : -1} {...go}>{t('On sale')}</Link>
          <Link to="/shop" tabIndex={open ? 0 : -1} className="mega__all" {...go}>{t('All products')} <ArrowRight /></Link>
        </div>
        {shoes.length > 0 && (
          <div className="mega__col">
            <h4>{t('Footwear')}</h4>
            {shoes.map(c => <Link key={c.id} to={`/shop?cat=${c.id}`} tabIndex={open ? 0 : -1} {...go}>{tc(c.name)}<small>{count(c.id)}</small></Link>)}
          </div>
        )}
        {apparel.length > 0 && (
          <div className="mega__col">
            <h4>{t('Apparel')}</h4>
            {apparel.map(c => <Link key={c.id} to={`/shop?cat=${c.id}`} tabIndex={open ? 0 : -1} {...go}>{tc(c.name)}<small>{count(c.id)}</small></Link>)}
          </div>
        )}
        <div className="mega__col">
          <h4>{t('Shop by')}</h4>
          <Link to="/shop?for=men" tabIndex={open ? 0 : -1} {...go}>{t('Men')}</Link>
          <Link to="/shop?for=women" tabIndex={open ? 0 : -1} {...go}>{t('Women')}</Link>
          <Link to="/shop?for=unisex" tabIndex={open ? 0 : -1} {...go}>{t('Unisex')}</Link>
        </div>
        {promo && (
          <Link to={`/product/${promo.id}`} className="mega__promo" tabIndex={open ? 0 : -1} {...go}>
            <img src={thumb(promo)} alt="" loading="lazy" />
            <span><em>{promo.compareAt ? t('On sale') : t('Featured')}</em><b>{pName(promo)}</b><small>{money(promo.price)}{promo.compareAt && <s> {money(promo.compareAt)}</s>}</small><u>{t('Shop now')} →</u></span>
          </Link>
        )}
      </div>
    </div>
  );
}
