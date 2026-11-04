import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useScroll } from '../hooks/useScroll.js';
import { useGoto } from '../hooks/useGoto.js';
import { BagIcon, SearchIcon } from './Icons.jsx';
import Logo from './Logo.jsx';
import ShopMenu from './ShopMenu.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { LangSwitch } from '../i18n/LangContext.jsx';
import { t, tc } from '../i18n/index.js';

const SECTIONS = [
  { id: 'rail', label: 'The Rail', n: '01' },
  { id: 'orbit', label: 'Orbit', n: '02' },
  { id: 'runway', label: 'Runway', n: '03' },
  { id: 'story', label: 'Story', n: '04' }
];

export default function Header() {
  const { count, bump, openCart, openSearch, menuOpen, setMenuOpen } = useStore();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const goto = useGoto();
  const solid = pathname !== '/';
  const [top, setTop] = useState(true);
  const [hide, setHide] = useState(false);
  const [mega, setMega] = useState(false);
  const megaTimer = useRef(0);
  const { categories } = useCatalog();
  // hover-intent: open instantly, close after a short grace period so the pointer can travel into the panel
  const openMega = () => { clearTimeout(megaTimer.current); setMega(true); };
  const closeMega = () => { clearTimeout(megaTimer.current); megaTimer.current = setTimeout(() => setMega(false), 160); };
  useEffect(() => { setMega(false); }, [pathname]);
  useEffect(() => { const k = e => { if (e.key === 'Escape') setMega(false); }; document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, []);

  // hide on scroll-down, reveal on scroll-up (state only changes when the flag flips)
  const acc = useRef({ v: 0 }).current;
  useScroll(({ y, dy }) => {
    setTop(y < 40);
    if (y > 500 && dy > 4) acc.v = Math.min(acc.v + dy, 60); else if (dy < -4) acc.v = 0;
    setHide(y > 500 && acc.v >= 60);
  });

  const go = id => e => { e.preventDefault(); setMenuOpen(false); goto(id); };

  const cls = ['hdr', top && 'is-top', solid && 'hdr--solid', hide && !menuOpen && 'is-hide', menuOpen && 'menu-open', mega && 'mega-open'].filter(Boolean).join(' ');

  return (
    <>
      <header className={cls} id="hdr" onMouseLeave={closeMega}>
        <Link className="logo" to="/" aria-label={t("VANTA home")} data-cursor={t("Home")} onClick={() => setMenuOpen(false)}>
          <Logo />
        </Link>
        <nav className="nav" aria-label={t("Primary")}>
          {SECTIONS.map(s => <a key={s.id} href="#/" data-n={s.n} onClick={go(s.id)}>{t(s.label)}</a>)}
          <Link to="/shop" data-n="05" className={'nav__shop' + (mega ? ' on' : '')} aria-haspopup="true" aria-expanded={mega} onMouseEnter={openMega} onFocus={openMega}>{t('Shop')}<i aria-hidden="true" /></Link>
        </nav>
        <div className="mega__wrap" onMouseEnter={openMega} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) closeMega(); }}><ShopMenu open={mega} onNavigate={() => setMega(false)} /></div>
        <div className="hdr__r">
          <LangSwitch className="langsw--hdr" />
          <button className="pill" type="button" aria-label={t("Search")} onClick={openSearch}>
            <SearchIcon /><span>{t("Search")}</span><kbd>/</kbd>
          </button>
          <Link className="acct" to={user ? '/account' : '/login'} aria-label={user ? t('My account') : t('Sign in')} data-cursor={user ? t('Account') : t('Sign in')}>
            {user ? <span className="acct__av">{user.name[0].toUpperCase()}</span> : <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 21a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}
          </Link>
          <button key={bump} className={'bag' + (bump ? ' bump' : '')} type="button" aria-label={t("Open bag")} onClick={openCart}>
            <BagIcon /><em className={count > 0 ? 'has' : ''}>{count}</em>
          </button>
          <button className="burger" type="button" aria-label={t("Menu")} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <i /><i />
          </button>
        </div>
      </header>

      <div className={'menu' + (menuOpen ? ' open' : '')}>
        {SECTIONS.map(s => <a key={s.id} href="#/" onClick={go(s.id)}>{t(s.label)}</a>)}
        <Link to="/shop" onClick={() => setMenuOpen(false)}>{t("Shop")}</Link>
        <div className="menu__sub">{categories.map(c => <Link key={c.id} to={`/shop?cat=${c.id}`} onClick={() => setMenuOpen(false)}>{tc(c.name)}</Link>)}<Link to="/shop?for=men" onClick={() => setMenuOpen(false)}>{t('Men')}</Link><Link to="/shop?for=women" onClick={() => setMenuOpen(false)}>{t('Women')}</Link></div>
        <Link to={user ? '/account' : '/login'} onClick={() => setMenuOpen(false)}>{user ? t('Account') : t('Sign in')}</Link>
      </div>
    </>
  );
}
