import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { t, rich } from '../i18n/index.js';

/** Customer-only routes (checkout, account, wishlist). Guests are sent to /login and returned afterwards. */
export function RequireAuth({ reason }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search, reason: reason || 'account' }} />;
  return <Outlet />;
}

/** Admin-only routes. Signed-in customers get a clear 403 instead of a silent redirect. */
export function RequireAdmin({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname, reason: 'admin' }} />;
  if (user.role !== 'admin') return <Forbidden />;
  return children;
}

export function Forbidden() {
  return (
    <main className="page">
      <div className="wrap narrow center">
        <p className="eyebrow dark" style={{ justifyContent: 'center' }}><span className="n">403</span> {t('No access')}</p>
        <h1 className="h2 page__title">{rich(t('Admins\n*only.*'))}</h1>
        <p className="lede" style={{ margin: '0 auto 28px' }}>{t("Your account does not have permission to open this page.")}</p>
        <a className="btn btn--solid" href="#/"><span>{t("Back to the store")}</span></a>
      </div>
    </main>
  );
}
