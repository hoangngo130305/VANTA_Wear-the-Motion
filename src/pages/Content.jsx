import { useState } from 'react';
import { Link, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { asset } from '../data/catalog.js';
import { Accordion, Field, useAsync } from '../components/ui/index.jsx';
import Reveal from '../components/Reveal.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { sleep } from '../api/db.js';
import { fillText, rich, t, tc } from '../i18n/index.js';
import { money } from '../lib/utils.js';
import { useGoto } from '../hooks/useGoto.js';

/** {free} / {brand} placeholders available inside editable content */
function useVars() {
  const { content, settings } = useCatalog();
  return { free: money(settings.freeShippingFrom), brand: content.brand.name };
}

const Page = ({ eyebrow, title, lede, children, narrow }) => (
  <main className="page">
    <div className={'wrap' + (narrow ? ' narrow' : '')}>
      <Reveal as="p" className="eyebrow dark"><span className="n">✦</span> {eyebrow}</Reveal>
      <Reveal as="h1" className="h2 page__title">{title}</Reveal>
      {lede && <Reveal as="p" className="lede page__lede">{lede}</Reveal>}
      {children}
    </div>
  </main>
);

/* ---------------- about ---------------- */
export function About() {
  const { content: { about: a } } = useCatalog();
  const vars = useVars();
  const goto = useGoto();
  const navigate = useNavigate();
  const open = e => { e.preventDefault(); if (a.cta.link.startsWith('/')) navigate(a.cta.link); else goto(a.cta.link); };
  return (
    <Page eyebrow={tc(a.eyebrow)} title={rich(a.title)} lede={fillText(a.lede, vars)}>
      <div className="about__hero">
        <figure className="ph in"><img src={asset(a.image1.image)} alt={tc(a.image1.alt)} loading="lazy" /></figure>
        <figure className="ph in"><img src={asset(a.image2.image)} alt={tc(a.image2.alt)} loading="lazy" /></figure>
      </div>
      <div className="stats stats--page">
        {a.stats.map((s, i) => <div key={i}><b>{s.value}</b><span>{tc(s.label)}</span></div>)}
      </div>
      <h2 className="h2 related__title">{rich(a.valuesTitle)}</h2>
      <div className="values">
        {a.values.map((v, i) => <Reveal key={i} className="value" style={{ '--d': i * 0.08 + 's' }}><i>0{i + 1}</i><h3>{tc(v.title)}</h3><p>{tc(v.text)}</p></Reveal>)}
      </div>
      <div className="cta-band"><img src={asset(a.cta.image)} alt="" /><div><h2 className="h2">{rich(a.cta.title)}</h2><p>{tc(a.cta.text)}</p><a className="btn btn--lime" href="#/" onClick={open}><span>{tc(a.cta.button)}</span></a></div></div>
    </Page>
  );
}

/* ---------------- contact ---------------- */
export function Contact() {
  const { showToast } = useStore();
  const { content: { contact: c } } = useCatalog();
  const op = useAsync();
  const [f, setF] = useState({ name: '', email: '', topic: 'Order help', message: '' });
  const [err, setErr] = useState({});
  const topics = ['Order help', 'Sizing', 'Returns', 'Wholesale & collabs', 'Press'];

  const submit = async e => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = t('Please enter your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) x.email = t('Enter a valid email address.');
    if (f.message.trim().length < 10) x.message = t('Tell us a bit more (10+ characters).');
    setErr(x);
    if (Object.keys(x).length) return;
    await op.run(() => sleep(600));
    setF({ name: '', email: '', topic: 'Order help', message: '' });
    showToast(<><span className="tick">✓</span><span>{t('Message sent — we reply within 24h.')}</span></>, 3600);
  };

  return (
    <Page eyebrow={t('Contact')} title={rich(c.title)} lede={tc(c.lede)}>
      <div className="contact">
        <form onSubmit={submit} noValidate className="panel">
          <div className="fields">
            <Field label={t('Your name')} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={err.name} />
            <Field label={t('Email')} type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} error={err.email} />
            <Field label={t('Topic')} as="select" className="span2" value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })}>{topics.map(k => <option key={k} value={k}>{t(k)}</option>)}</Field>
            <Field label={t('Message')} as="textarea" rows={5} className="span2" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} error={err.message} />
          </div>
          <button className="btn btn--solid" type="submit" disabled={op.loading}><span>{op.loading ? t('Sending…') : t('Send message')}</span></button>
        </form>
        <aside className="contact__info">
          <div className="panel panel--soft"><h3>{t('Email')}</h3><p><a href={`mailto:${c.email}`}>{c.email}</a></p></div>
          <div className="panel panel--soft"><h3>{t('Studio')}</h3><p>{rich(c.address)}</p></div>
          <div className="panel panel--soft"><h3>{t('Hours')}</h3><p>{tc(c.hours)}</p></div>
          <p className="muted small">{t('Looking for an answer fast? Try the {link}.', { link: <Link to="/faq">{t('FAQ')}</Link> })}</p>
        </aside>
      </div>
    </Page>
  );
}

/* ---------------- faq ---------------- */
export function Faq() {
  const { content: { faq } } = useCatalog();
  const vars = useVars();
  return (
    <Page eyebrow={t('Help')} title={rich(faq.title)} lede={tc(faq.lede)} narrow>
      <Accordion items={faq.items.map(i => ({ q: tc(i.q), a: fillText(i.a, vars) }))} defaultOpen={0} />
      <p className="muted" style={{ marginTop: 28 }}>{t('Still stuck? {link}.', { link: <Link to="/contact">{t('Contact us')}</Link> })}</p>
    </Page>
  );
}

/* ---------------- policies ---------------- */
export function Policies() {
  const { tab } = useParams();
  const { content: { policies } } = useCatalog();
  const vars = useVars();
  const current = policies.tabs.find(x => x.key === (tab || policies.tabs[0]?.key));
  if (!current) return <Navigate to={`/policies/${policies.tabs[0]?.key || 'shipping'}`} replace />;
  return (
    <Page eyebrow={t('Policies')} title={tc(current.title)} narrow>
      <nav className="tabs" aria-label={t('Policies')}>{policies.tabs.map(x => <NavLink key={x.key} to={`/policies/${x.key}`}>{tc(x.title)}</NavLink>)}</nav>
      <div className="prose">{current.sections.map((s, i) => <section key={i}><h3>{tc(s.h)}</h3><p>{fillText(s.p, vars)}</p></section>)}</div>
    </Page>
  );
}

/* ---------------- 404 ---------------- */
export function NotFound() {
  return (
    <main className="page">
      <div className="wrap narrow center">
        <p className="eyebrow dark" style={{ justifyContent: 'center' }}><span className="n">404</span> {t('Lost')}</p>
        <h1 className="h2 page__title">{rich(t('Off the\n*rail.*'))}</h1>
        <p className="lede" style={{ margin: '0 auto 28px' }}>{t("That page doesn't exist — or it sold out.")}</p>
        <div className="row gap" style={{ justifyContent: 'center' }}><Link className="btn btn--solid" to="/"><span>{t('Home')}</span></Link><Link className="btn btn--ghost" to="/shop"><span>{t('Shop')}</span></Link></div>
      </div>
    </main>
  );
}
