import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { STATUSES, listAllOrders, markOrderPaid, nextStatuses, updateOrderStatus, getOrder } from '../../api/orders.js';
import { useData } from '../../components/admin/useData.js';
import { useStore } from '../../context/StoreContext.jsx';
import { PageHead } from '../../components/admin/AdminLayout.jsx';
import { PayBadge, StatusBadge, Timeline, fmtDate, methodLabel } from '../../components/OrderParts.jsx';
import { Spinner, useAsync } from '../../components/ui/index.jsx';
import { money } from '../../lib/utils.js';
import { itemName } from '../../i18n/helpers.js';
import { downloadCsv } from '../../lib/image.js';
import { t } from '../../i18n/index.js';

export function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { data, error, loading } = useData(listAllOrders);
  const status = params.get('status') || 'all', pay = params.get('pay') || 'all', q = params.get('q') || '';
  const set = (k, v) => { const n = new URLSearchParams(params); if (!v || v === 'all') n.delete(k); else n.set(k, v); setParams(n, { replace: true }); };

  const list = (data || []).filter(o => (status === 'all' || o.status === status) && (pay === 'all' || o.payment.status === pay)
    && (!q || (o.id + o.customerName + o.email).toLowerCase().includes(q.toLowerCase())));

  const exportCsv = () => downloadCsv('orders.csv', [
    ['Order', 'Date', 'Customer', 'Email', 'Status', 'Payment', 'Method', 'Subtotal', 'Discount', 'Shipping', 'Total'],
    ...list.map(o => [o.id, new Date(o.createdAt).toISOString(), o.customerName, o.email, o.status, o.payment.status, o.payment.method, o.subtotal, o.discount, o.shippingFee, o.total])
  ]);

  return (
    <>
      <PageHead title={t("Orders")} sub={data ? t('{n} of {total} orders', { n: list.length, total: data.length }) : ''} actions={<button className="btn btn--ghost btn--sm" type="button" onClick={exportCsv} disabled={!list.length}><span>{t("Export CSV")}</span></button>} />
      <div className="adm__filters">
        <input type="search" placeholder={t("Search order, name or email…")} value={q} onChange={e => set('q', e.target.value)} aria-label={t("Search orders")} />
        <select value={status} onChange={e => set('status', e.target.value)} aria-label={t("Status")}><option value="all">{t("All statuses")}</option>{STATUSES.map(s => <option key={s} value={s}>{t(s)}</option>)}</select>
        <select value={pay} onChange={e => set('pay', e.target.value)} aria-label={t("Payment")}><option value="all">{t("All payments")}</option>{['paid', 'unpaid', 'refunded'].map(s => <option key={s} value={s}>{t(s)}</option>)}</select>
      </div>
      {error ? <p className="form-error">{error}</p> : loading ? <Spinner /> : (
        <div className="tablewrap">
          <table className="table table--click">
            <thead><tr><th>{t("Order")}</th><th>{t("Date")}</th><th>{t("Customer")}</th><th>{t("Payment")}</th><th>{t("Status")}</th><th className="r">{t("Total")}</th></tr></thead>
            <tbody>
              {list.map(o => (
                <tr key={o.id} tabIndex={0} onClick={() => navigate(`/admin/orders/${o.id}`)} onKeyDown={e => { if (e.key === 'Enter') navigate(`/admin/orders/${o.id}`); }}>
                  <td><b>{o.id}</b></td><td>{fmtDate(o.createdAt)}</td><td>{o.customerName}<small>{o.email}</small></td>
                  <td>{methodLabel(o.payment.method)} <PayBadge status={o.payment.status} /></td><td><StatusBadge status={o.status} /></td><td className="r">{money(o.total)}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="6" className="muted center-cell">{t("No orders match.")}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function AdminOrder() {
  const { id } = useParams();
  const { showToast } = useStore();
  const { data: o, error, loading } = useData(() => getOrder(id), [id]);
  const op = useAsync();
  const [note, setNote] = useState('');

  if (error) return <p className="form-error">{error} <Link to="/admin/orders">{t("Back")}</Link></p>;
  if (loading) return <Spinner />;
  const nexts = nextStatuses(o.status);
  const move = async s => {
    const r = await op.run(() => updateOrderStatus(o.id, s, note));
    if (r) { setNote(''); showToast(<><span className="tick">✓</span><span>{o.id} → {s}</span></>, 2200); }
  };
  const paid = async () => { const r = await op.run(() => markOrderPaid(o.id)); if (r) showToast(<><span className="tick">✓</span><span>{t("Marked as paid")}</span></>, 2000); };
  const s = o.shipping;

  return (
    <>
      <PageHead title={t('Order {id}', { id: o.id })} sub={t('Placed {date}', { date: fmtDate(o.createdAt, true) })} actions={<><Link className="btn btn--ghost btn--sm" to="/admin/orders"><span>{t("← Orders")}</span></Link><button className="btn btn--ghost btn--sm" type="button" onClick={() => window.print()}><span>{t("Print")}</span></button></>} />
      <div className="adm__cols adm__cols--order">
        <div className="stack">
          <section className="card-a"><h2>{t("Items")}</h2>
            <ul className="osum__items osum__items--lg">{o.items.map((l, i) => <li key={i}><div className="osum__img"><img src={l.img} alt="" /><em>{l.qty}</em></div><div><b>{itemName(l)}</b><small>{l.size} · {money(l.price)}</small></div><span>{money(l.price * l.qty)}</span></li>)}</ul>
            <dl className="osum__dl"><div><dt>{t("Subtotal")}</dt><dd>{money(o.subtotal)}</dd></div>{o.discount > 0 && <div className="osum__disc"><dt>{t('Discount ({code})', { code: o.coupon?.code })}</dt><dd>−{money(o.discount)}</dd></div>}<div><dt>{t('Shipping ({method})', { method: t(s.method) })}</dt><dd>{o.shippingFee ? money(o.shippingFee) : t('Free')}</dd></div><div className="osum__total"><dt>{t("Total")}</dt><dd>{money(o.total)}</dd></div></dl>
          </section>
          <section className="card-a"><h2>{t("Timeline")}</h2><Timeline order={o} /></section>
        </div>
        <div className="stack">
          <section className="card-a noprint"><h2>{t("Status")}</h2>
            <p className="row gap"><StatusBadge status={o.status} /><PayBadge status={o.payment.status} /></p>
            {nexts.length > 0 ? <>
              <Field2 label={t("Note (optional, shown in timeline)")}><input value={note} onChange={e => setNote(e.target.value)} placeholder={t("e.g. Tracking VN123456")} /></Field2>
              <div className="stack gap">{nexts.map(n => <button key={n} type="button" className={'btn btn--sm ' + (n === 'cancelled' ? 'btn--ghost btn--danger' : 'btn--solid')} disabled={op.loading} onClick={() => move(n)}><span>{t('Mark as {status}', { status: t(n) })}</span></button>)}</div>
            </> : <p className="muted">{t('This order is {status} — no further actions.', { status: t(o.status) })}</p>}
            {o.payment.status === 'unpaid' && o.status !== 'cancelled' && <button type="button" className="btn btn--ghost btn--sm" disabled={op.loading} onClick={paid}><span>{t("Confirm payment received")}</span></button>}
            {op.error && <p className="form-error" role="alert">{op.error}</p>}
          </section>
          <section className="card-a"><h2>{t("Customer")}</h2><p><b>{s.name}</b><br />{o.email}<br />{s.phone}</p></section>
          <section className="card-a"><h2>{t("Ship to")}</h2><address>{s.line1}<br />{s.city}, {s.province} {s.zip}<br />{t(s.country)}</address></section>
          <section className="card-a"><h2>{t("Payment")}</h2><p>{methodLabel(o.payment.method)}</p><p className="muted small">{t(o.payment.detail)} · {o.payment.ref}</p></section>
        </div>
      </div>
    </>
  );
}

const Field2 = ({ label, children }) => <label className="field2"><span>{label}</span>{children}</label>;
