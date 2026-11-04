import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { listMyOrders } from '../../api/orders.js';
import { money } from '../../lib/utils.js';
import { StatusBadge, fmtDate } from '../../components/OrderParts.jsx';
import { Empty, Spinner } from '../../components/ui/index.jsx';
import { t } from '../../i18n/index.js';

export function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const out = () => { logout(); navigate('/', { replace: true }); };
  const links = [['/account', 'Overview', true], ['/account/orders', 'Orders'], ['/account/wishlist', 'Wishlist'], ['/account/addresses', 'Addresses'], ['/account/profile', 'Profile & security']];
  return (
    <main className="page">
      <div className="wrap">
        <p className="eyebrow dark"><span className="n">{t("Me")}</span> {t('Account')}</p>
        <h1 className="h2 page__title acc-title">{t('Hi,')} <em>{user.name.split(' ')[0]}.</em></h1>
        <div className="account">
          <nav className="account__nav" aria-label={t("Account")}>
            {links.map(([to, label, end]) => <NavLink key={to} to={to} end={end}>{t(label)}</NavLink>)}
            {user.role === 'admin' && <Link to="/admin" className="account__admin">{t("Admin console →")}</Link>}
            <button type="button" onClick={out}>{t("Sign out")}</button>
          </nav>
          <div className="account__body"><Outlet /></div>
        </div>
      </div>
    </main>
  );
}

/** load the signed-in user's orders (newest first) */
export function useMyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const { version } = useCatalog();
  useEffect(() => {
    let live = true;
    listMyOrders().then(o => live && setOrders(o)).catch(e => live && setError(e.message));
    return () => { live = false; };
  }, [version]);
  return { orders, error };
}

export function Overview() {
  const { user } = useAuth();
  const { orders, error } = useMyOrders();
  const spent = (orders || []).filter(o => !['cancelled', 'returned'].includes(o.status)).reduce((a, o) => a + o.total, 0);
  const active = (orders || []).filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;
  return (
    <>
      <div className="kpis kpis--3">
        <div><small>{t("Orders")}</small><b>{orders ? orders.length : '—'}</b></div>
        <div><small>{t("In progress")}</small><b>{orders ? active : '—'}</b></div>
        <div><small>{t("Total spent")}</small><b>{orders ? money(spent) : '—'}</b></div>
      </div>
      <div className="panel">
        <div className="panel__head"><h2>{t("Recent orders")}</h2><Link className="link" to="/account/orders"><span>{t("View all")}</span></Link></div>
        {error ? <p className="form-error">{error}</p> : !orders ? <Spinner /> : orders.length === 0
          ? <Empty title={t("No orders yet")} text={t('Your first order will show up here.')} action={<Link className="btn btn--solid" to="/shop"><span>{t("Start shopping")}</span></Link>} />
          : <OrderList orders={orders.slice(0, 3)} />}
      </div>
      <div className="panel panel--soft">
        <h2>{t("Wishlist")}</h2>
        <p className="muted">{user.wishlist.length ? (user.wishlist.length === 1 ? t('1 saved piece.') : t('{n} saved pieces.', { n: user.wishlist.length })) : t('Tap the heart on any product to save it.')} <Link to="/account/wishlist">{t("Open wishlist")}</Link></p>
      </div>
    </>
  );
}

export function OrderList({ orders }) {
  return (
    <ul className="olist">
      {orders.map(o => (
        <li key={o.id}>
          <Link to={`/account/orders/${o.id}`}>
            <div className="olist__imgs">{o.items.slice(0, 3).map((i, k) => <img key={k} src={i.img} alt="" />)}</div>
            <div className="olist__main"><b>{o.id}</b><small>{fmtDate(o.createdAt)} · {t('{n} item(s)', { n: o.items.reduce((a, i) => a + i.qty, 0) })}</small></div>
            <StatusBadge status={o.status} />
            <strong>{money(o.total)}</strong>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Orders() {
  const { orders, error } = useMyOrders();
  const [f, setF] = useState('all');
  const list = (orders || []).filter(o => f === 'all' || o.status === f);
  return (
    <div className="panel">
      <div className="panel__head"><h2>{t("Orders")}</h2>
        <select value={f} onChange={e => setF(e.target.value)} aria-label={t("Filter orders")}>
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map(s => <option key={s} value={s}>{s === 'all' ? t('All orders') : t(s)}</option>)}
        </select>
      </div>
      {error ? <p className="form-error">{error}</p> : !orders ? <Spinner /> : list.length === 0 ? <Empty title={t("No orders here")} text={t('Nothing matches this filter.')} /> : <OrderList orders={list} />}
    </div>
  );
}
