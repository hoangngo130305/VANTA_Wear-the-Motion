import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Close } from '../Icons.jsx';
import { t } from '../../i18n/index.js';

/* ---------- stars ---------- */
export function Stars({ value = 0, size = 16, onChange, label }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className={'stars' + (onChange ? ' stars--input' : '')} role={onChange ? 'radiogroup' : 'img'} aria-label={label || t('{n} out of 5', { n: value.toFixed(1) })} style={{ '--sz': size + 'px' }}>
      {[1, 2, 3, 4, 5].map(n => {
        const fill = Math.max(0, Math.min(1, shown - (n - 1)));
        const props = onChange ? { onMouseEnter: () => setHover(n), onMouseLeave: () => setHover(0), onClick: () => onChange(n), role: 'radio', 'aria-checked': value === n, 'aria-label': n === 1 ? t('1 star') : t('{n} stars', { n }), type: 'button' } : {};
        const Tag = onChange ? 'button' : 'span';
        return <Tag key={n} className="star" {...props}><i style={{ width: fill * 100 + '%' }} /></Tag>;
      })}
    </span>
  );
}

/* ---------- badge ---------- */
export const Badge = ({ tone = 'neutral', children }) => <span className={'badge badge--' + tone}>{children}</span>;

/* ---------- accordion ---------- */
export function Accordion({ items, defaultOpen = -1 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="acc">
      {items.map((it, i) => (
        <div className={'acc__item' + (open === i ? ' open' : '')} key={i}>
          <button type="button" className="acc__q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{it.q}</span><i aria-hidden="true" />
          </button>
          <div className="acc__a" role="region"><div><p>{it.a}</p></div></div>
        </div>
      ))}
    </div>
  );
}

/* ---------- form field ---------- */
export function Field({ label, error, hint, as = 'input', children, className = '', ...props }) {
  const id = useId();
  const Tag = as;
  return (
    <div className={'field ' + className + (error ? ' has-error' : '')}>
      {label && <label htmlFor={id}>{label}</label>}
      {as === 'select'
        ? <select id={id} aria-invalid={!!error} {...props}>{children}</select>
        : <Tag id={id} aria-invalid={!!error} aria-describedby={error ? id + 'e' : undefined} {...props} />}
      {error ? <small className="field__err" id={id + 'e'} role="alert">{error}</small> : hint ? <small className="field__hint">{hint}</small> : null}
    </div>
  );
}

/* ---------- misc ---------- */
export const Spinner = ({ label = 'Loading' }) => <span className="spinner" role="status" aria-label={label} />;

export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 22h40l-3 32H15zM22 22v-4a10 10 0 0 1 20 0v4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /></svg>
      <h3>{title}</h3>{text && <p>{text}</p>}{action}
    </div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="crumbs" aria-label={t("Breadcrumb")}>
      {items.map((it, i) => (
        <span key={i}>{it.to ? <Link to={it.to}>{t(it.label)}</Link> : <span aria-current="page">{t(it.label)}</span>}{i < items.length - 1 && <i>/</i>}</span>
      ))}
    </nav>
  );
}

/** Centered dialog with focus trap-lite (focus in, Esc, backdrop click). */
export function Modal({ open, onClose, title, children, wide }) {
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => box.current?.querySelector('input,button:not(.modal__x),select,textarea')?.focus({ preventScroll: true }), 60);
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', key);
    return () => { clearTimeout(t); document.body.style.overflow = ''; document.removeEventListener('keydown', key); prev?.focus?.({ preventScroll: true }); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__bd" onClick={onClose} />
      <div className={'modal__box' + (wide ? ' modal__box--wide' : '')} ref={box}>
        <header><h3>{title}</h3><button type="button" className="modal__x" aria-label={t("Close")} onClick={onClose}><Close /></button></header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

/** run an async action and expose loading + error state */
export function useAsync() {
  const [state, setState] = useState({ loading: false, error: '', field: '' });
  const run = async fn => {
    setState({ loading: true, error: '', field: '' });
    try { const r = await fn(); setState({ loading: false, error: '', field: '' }); return r; }
    catch (e) { setState({ loading: false, error: e.message || t('Something went wrong.'), field: e.field || '' }); return undefined; }
  };
  return { ...state, run, clear: () => setState({ loading: false, error: '', field: '' }) };
}
