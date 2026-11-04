import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGoto } from '../hooks/useGoto.js';
import { useReveal } from '../hooks/useReveal.js';
import { useContent } from '../context/CatalogContext.jsx';
import { fillText, t, tc } from '../i18n/index.js';
import { reduceMotion } from '../lib/utils.js';

export default function Footer() {
  const goto = useGoto();
  const word = useRef(null);
  useReveal(word);
  const { brand, footer } = useContent();
  const to = id => e => { e.preventDefault(); goto(id); };
  const vars = { brand: brand.name };

  return (
    <footer className="foot">
      <div className="wrap foot__grid">
        <div><h4>{t('Shop')}</h4>
          <Link to="/shop">{t('All products')}</Link>
          <a href="#/" onClick={to('rail')}>{t('The Rail')}</a>
          <a href="#/" onClick={to('orbit')}>{t('Orbit')}</a>
          <a href="#/" onClick={to('runway')}>{t('Runway')}</a>
        </div>
        <div><h4>{t('Help')}</h4>
          <Link to="/faq">{t('FAQ')}</Link>
          <Link to="/policies/shipping">{t('Shipping')}</Link>
          <Link to="/policies/returns">{t('Returns')}</Link>
          <Link to="/contact">{t('Contact')}</Link>
        </div>
        <div><h4>{t('Company')}</h4>
          <Link to="/about">{t('About')}</Link>
          <Link to="/account">{t('My account')}</Link>
          <Link to="/policies/privacy">{t('Privacy')}</Link>
          <Link to="/policies/terms">{t('Terms')}</Link>
        </div>
        <div><h4>{brand.name}</h4><p>{tc(brand.tagline)}</p>
          {footer.socials.length > 0 && (
            <div className="foot__social">{footer.socials.map((s, i) => <a key={i} href={s.url} target={s.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{s.label}</a>)}</div>
          )}
        </div>
      </div>
      <div className="foot__word" ref={word} aria-hidden="true">
        {[...brand.name.toUpperCase()].map((c, i) => <span key={i} style={{ '--i': i }}>{c}</span>)}
      </div>
      <div className="wrap foot__bar">
        <span>{fillText(footer.copyright, vars)}</span>
        <button type="button" onClick={() => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}>{t('Back to top')} ↑</button>
      </div>
    </footer>
  );
}
