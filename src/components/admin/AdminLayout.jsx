import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import Toast from '../Toast.jsx';
import { LangSwitch } from '../../i18n/LangContext.jsx';
import { t } from '../../i18n/index.js';

const NAV = [
  ['/admin', 'Dashboard', 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z', true],
  ['/admin/orders', 'Orders', 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0'],
  ['/admin/content', 'Content', 'M4 4h16v16H4zM4 9h16M9 9v11'],
  ['/admin/categories', 'Categories', 'M4 6h16M4 12h16M4 18h10'],
  ['/admin/products', 'Products', 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8'],
  ['/admin/customers', 'Customers', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'],
  ['/admin/coupons', 'Coupons', 'M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'],
  ['/admin/settings', 'Settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z']
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const brandName = useCatalog().content.brand.name;
  return (
    <div className="adm">
      <aside className={'adm__side' + (open ? ' open' : '')}>
        <Link to="/admin" className="adm__logo"><svg viewBox="0 0 34 24"><path d="M0 0h8.5L17 16.5 25.5 0H34L21.4 24h-8.8z" fill="currentColor" /></svg><b>{brandName}</b><em>{t("Admin")}</em></Link>
        <nav onClick={() => setOpen(false)}>
          {NAV.map(([to, label, d, end]) => (
            <NavLink key={to} to={to} end={end}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>{t(label)}</NavLink>
          ))}
        </nav>
        <div className="adm__foot">
          <LangSwitch className="langsw--adm" />
          <Link to="/" target="_blank" rel="noreferrer">{t("View store ↗")}</Link>
          <div className="adm__me"><span>{user.name[0]}</span><div><b>{user.name}</b><small>{user.email}</small></div></div>
          <button type="button" onClick={() => { logout(); navigate('/login'); }}>{t("Sign out")}</button>
        </div>
      </aside>
      {open && <div className="adm__scrim" onClick={() => setOpen(false)} />}
      <div className="adm__main">
        <header className="adm__top"><button type="button" className="adm__burger" aria-label={t("Menu")} onClick={() => setOpen(o => !o)}><i /><i /><i /></button><span>{t("Console")}</span><LangSwitch className="langsw--adm langsw--top" /></header>
        <div className="adm__page"><Outlet /></div>
      </div>
      <Toast />
    </div>
  );
}

export function PageHead({ title, sub, actions }) {
  return <div className="adm__head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="adm__actions">{actions}</div></div>;
}
