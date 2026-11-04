import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, useAsync } from '../components/ui/index.jsx';
import { requestPasswordReset } from '../api/auth.js';
import { asset } from '../data/catalog.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { LangSwitch } from '../i18n/LangContext.jsx';
import { tc, t } from '../i18n/index.js';

const REASONS = {
  checkout: 'Sign in to finish your order. Your bag is saved.',
  wishlist: 'Sign in to save your wishlist.',
  review: 'Sign in to write a review.',
  admin: 'Sign in with an admin account to open the console.',
  account: 'Sign in to open your account.'
};

function Shell({ title, sub, children, foot, reason }) {
  const { content: { auth, brand } } = useCatalog();
  return (
    <main className="auth">
      <div className="auth__art" style={{ backgroundImage: `url(${asset(auth.image)})` }} aria-hidden="true">
        <div><p>{tc(auth.tagline)}</p><small>{tc(auth.sub)}</small></div>
      </div>
      <div className="auth__panel">
        <LangSwitch className="langsw--corner" />
        <div className="auth__box">
          <Link to="/" className="auth__logo">{brand.logo ? <img src={asset(brand.logo)} alt={brand.name} /> : brand.name}</Link>
          <h1>{title}</h1>
          <p className="muted">{sub}</p>
          {reason && <p className="notice" role="status">{reason}</p>}
          {children}
          <p className="auth__foot">{foot}</p>
        </div>
      </div>
    </main>
  );
}

const useReturn = () => {
  const loc = useLocation();
  const nav = useNavigate();
  const from = loc.state?.from;
  return { reason: REASONS[loc.state?.reason] ? t(REASONS[loc.state?.reason]) : undefined, state: loc.state, done: user => nav(from || (user.role === 'admin' ? '/admin' : '/account'), { replace: true }) };
};

export function Login() {
  const { user, login } = useAuth();
  const brand = useCatalog().content.brand;
  const { reason, state, done } = useReturn();
  const op = useAsync();
  const [f, setF] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  if (user) return <Navigate to={state?.from || (user.role === 'admin' ? '/admin' : '/account')} replace />;

  const submit = async e => {
    e.preventDefault();
    const u = await op.run(() => login(f));
    if (u) done(u);
  };
  const fill = (email, password) => setF({ email, password });

  return (
    <Shell title={t("Welcome back")} sub={t('Sign in to your {brand} account.', { brand: brand.name })} reason={reason} foot={<>{t('New here?')} <Link to="/register" state={state}>{t('Create an account')}</Link></>}>
      <form onSubmit={submit} noValidate>
        <Field label={t("Email")} type="email" autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} error={op.field === 'email' ? op.error : ''} />
        <Field label={t("Password")} type={show ? 'text' : 'password'} autoComplete="current-password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} error={op.field === 'password' ? op.error : ''} />
        <div className="auth__row">
          <label className="check"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />{' '}{t("Show password")}</label>
          <Link to="/forgot">{t("Forgot password?")}</Link>
        </div>
        {op.error && !op.field && <p className="form-error" role="alert">{op.error}</p>}
        <button className="btn btn--solid btn--block" type="submit" disabled={op.loading}><span>{op.loading ? t('Signing in…') : t('Sign in')}</span></button>
      </form>
      <div className="demo">
        <p>{t("Demo accounts")}</p>
        <button type="button" onClick={() => fill('demo@vanta.com', 'Demo@123')}>{t('Customer')} <small>{t("demo@vanta.com")}</small></button>
        <button type="button" onClick={() => fill('admin@vanta.com', 'Admin@123')}>{t('Admin')} <small>{t("admin@vanta.com")}</small></button>
      </div>
    </Shell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const { reason, state, done } = useReturn();
  const op = useAsync();
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '' });
  const [agree, setAgree] = useState(false);
  const [local, setLocal] = useState('');
  if (user) return <Navigate to={state?.from || '/account'} replace />;

  const submit = async e => {
    e.preventDefault();
    setLocal('');
    if (!agree) { setLocal(t('Please accept the terms to continue.')); return; }
    const u = await op.run(() => register(f));
    if (u) done(u);
  };

  return (
    <Shell title={t("Create your account")} sub={t("Free, takes a minute. Get 10% off your first order with WELCOME10.")} reason={reason} foot={<>{t('Already a member?')} <Link to="/login" state={state}>{t('Sign in')}</Link></>}>
      <form onSubmit={submit} noValidate>
        <Field label={t("Full name")} autoComplete="name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={op.field === 'name' ? op.error : ''} />
        <Field label={t("Email")} type="email" autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} error={op.field === 'email' ? op.error : ''} />
        <Field label={t("Phone (optional)")} type="tel" autoComplete="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <Field label={t("Password")} type="password" autoComplete="new-password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} error={op.field === 'password' ? op.error : ''} />
        <ul className="pw">
          {[['8+ characters', f.password.length >= 8], ['Uppercase', /[A-Z]/.test(f.password)], ['Lowercase', /[a-z]/.test(f.password)], ['Number', /\d/.test(f.password)]].map(([l, ok]) => <li key={l} className={ok ? 'ok' : ''}>{l}</li>)}
        </ul>
        <label className="check"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> {t('I agree to the {terms} and {privacy}', { terms: <Link to="/policies/terms" target="_blank">{t('Terms')}</Link>, privacy: <Link to="/policies/privacy" target="_blank">{t('Privacy Policy')}</Link> })}</label>
        {(local || (op.error && !op.field)) && <p className="form-error" role="alert">{local || op.error}</p>}
        <button className="btn btn--solid btn--block" type="submit" disabled={op.loading}><span>{op.loading ? t('Creating…') : t('Create account')}</span></button>
      </form>
    </Shell>
  );
}

export function Forgot() {
  const op = useAsync();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async e => { e.preventDefault(); const ok = await op.run(() => requestPasswordReset(email)); if (ok) setSent(true); };
  return (
    <Shell title={t("Reset your password")} sub={t("Enter your email and we'll send reset instructions.")} foot={<Link to="/login">{t("Back to sign in")}</Link>}>
      {sent
        ? <p className="notice" role="status">{t('If an account exists for {email}, a reset link is on its way. (Demo store: no email is actually sent.)', { email: <b>{email}</b> })}</p>
        : <form onSubmit={submit} noValidate>
          <Field label={t("Email")} type="email" value={email} onChange={e => setEmail(e.target.value)} error={op.error} />
          <button className="btn btn--solid btn--block" type="submit" disabled={op.loading}><span>{op.loading ? t('Sending…') : t('Send reset link')}</span></button>
        </form>}
    </Shell>
  );
}
