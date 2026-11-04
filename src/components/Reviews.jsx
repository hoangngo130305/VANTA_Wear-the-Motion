import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listReviews, saveReview } from '../api/products.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { Badge, Field, Stars, useAsync } from './ui/index.jsx';
import { t, fmtDate } from '../i18n/index.js';

const ago = time => {
  const d = Math.floor((Date.now() - time) / 86400000);
  return d < 1 ? t('today') : d < 31 ? t('{n}d ago', { n: d }) : fmtDate(time);
};

export default function Reviews({ product }) {
  const { user } = useAuth();
  const { version } = useCatalog();
  const { showToast } = useStore();
  const location = useLocation();
  const op = useAsync();
  const [form, setForm] = useState({ rating: 0, title: '', body: '' });
  const [open, setOpen] = useState(false);

  const reviews = useMemo(() => listReviews(product.id), [product.id, version]);   // eslint-disable-line react-hooks/exhaustive-deps
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: reviews.filter(r => r.rating === n).length }));
  const mine = user && reviews.find(r => r.userId === user.id);

  const submit = async e => {
    e.preventDefault();
    const ok = await op.run(() => saveReview(product.id, form));
    if (ok) { setOpen(false); showToast(<><span className="tick">✓</span><span>{t("Thanks — your review is live.")}</span></>); }
  };

  return (
    <section className="reviews" id="reviews" aria-labelledby="rv-h">
      <div className="reviews__head">
        <h2 id="rv-h" className="h2 reviews__title">{t("Reviews")}</h2>
        {reviews.length > 0 && (
          <div className="reviews__sum">
            <b>{avg.toFixed(1)}</b><Stars value={avg} size={18} /><small>{reviews.length === 1 ? t('1 review') : t('{n} reviews', { n: reviews.length })}</small>
            <div className="bars">{dist.map(d => <div key={d.n}><span>{d.n}★</span><i><u style={{ width: (reviews.length ? d.c / reviews.length * 100 : 0) + '%' }} /></i><em>{d.c}</em></div>)}</div>
          </div>
        )}
        <div className="reviews__cta">
          {user
            ? <button className="btn btn--ghost" type="button" onClick={() => { setOpen(o => !o); if (mine) setForm({ rating: mine.rating, title: mine.title, body: mine.body }); }}><span>{mine ? t('Edit your review') : t('Write a review')}</span></button>
            : <p className="muted">{t('{link} to write a review.', { link: <Link to="/login" state={{ from: location.pathname, reason: 'review' }}>{t('Sign in')}</Link> })}</p>}
        </div>
      </div>

      {open && (
        <form className="reviews__form" onSubmit={submit} noValidate>
          <div className="field"><label>{t("Your rating")}</label><Stars value={form.rating} size={28} onChange={n => setForm(f => ({ ...f, rating: n }))} label={t("Your rating")} /></div>
          <Field label={t("Headline (optional)")} value={form.title} maxLength={80} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Field label={t("Your review")} as="textarea" rows={4} value={form.body} error={op.field === 'body' ? op.error : ''} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          {op.error && op.field !== 'body' && <p className="form-error" role="alert">{op.error}</p>}
          <button className="btn btn--solid" type="submit" disabled={op.loading}><span>{op.loading ? t('Saving…') : t('Submit review')}</span></button>
        </form>
      )}

      {reviews.length === 0
        ? <p className="muted reviews__none">{t("No reviews yet — be the first.")}</p>
        : <ul className="reviews__list">{reviews.map(r => (
          <li key={r.id}>
            <div className="reviews__top"><Stars value={r.rating} size={14} /><b>{r.title || t('Review')}</b>{r.verified && <Badge tone="lime">{t("Verified purchase")}</Badge>}</div>
            <p>{r.body}</p>
            <small>{r.userName.split(' ')[0]} · {ago(r.createdAt)}</small>
          </li>
        ))}</ul>}
    </section>
  );
}
