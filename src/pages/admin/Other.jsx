import { useState } from 'react';
import { listCustomers, setCustomerStatus } from '../../api/auth.js';
import { deleteCoupon, listCoupons, saveCoupon } from '../../api/coupons.js';
import { PERMISSIONS } from '../../api/permissions.js';
import { readSettings, resetDemoData, saveSettings } from '../../api/settings.js';
import { PAYMENT_METHODS } from '../../api/payments.js';
import { listAllOrders } from '../../api/orders.js';
import { useData } from '../../components/admin/useData.js';
import { useStore } from '../../context/StoreContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHead } from '../../components/admin/AdminLayout.jsx';
import { StatusBadge, fmtDate } from '../../components/OrderParts.jsx';
import { Badge, Field, Modal, Spinner, useAsync } from '../../components/ui/index.jsx';
import { money } from '../../lib/utils.js';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/index.js';


/* ---------------- customers ---------------- */
export function Customers() {
  const { data, error, loading } = useData(listCustomers);
  const orders = useData(listAllOrders);
  const { showToast } = useStore();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const list = (data || []).filter(c => !q || (c.name + c.email).toLowerCase().includes(q.toLowerCase()));
  const toggle = async c => {
    try { await setCustomerStatus(c.id, c.status === 'active' ? 'disabled' : 'active'); showToast(<span>{t(c.status === 'active' ? '{name} disabled.' : '{name} enabled.', { name: c.name })}</span>, 2000); }
    catch (e) { showToast(<span>{e.message}</span>); }
  };
  const theirs = sel ? (orders.data || []).filter(o => o.userId === sel.id) : [];
  return (
    <>
      <PageHead title={t("Customers")} sub={data ? t('{n} registered', { n: data.length }) : ''} />
      <div className="adm__filters"><input type="search" placeholder={t("Search name or email…")} value={q} onChange={e => setQ(e.target.value)} aria-label={t("Search customers")} /></div>
      {error ? <p className="form-error">{error}</p> : loading ? <Spinner /> : (
        <div className="tablewrap"><table className="table">
          <thead><tr><th>{t("Customer")}</th><th>{t("Joined")}</th><th className="r">{t("Orders")}</th><th className="r">{t("Spent")}</th><th>{t("Status")}</th><th /></tr></thead>
          <tbody>{list.map(c => (
            <tr key={c.id}><td><b>{c.name}</b><small>{c.email}</small></td><td>{fmtDate(c.createdAt)}</td><td className="r">{c.orderCount}</td><td className="r">{money(c.spent)}</td>
              <td>{c.status === 'active' ? <Badge tone="ok">{t("active")}</Badge> : <Badge tone="dark">{t("disabled")}</Badge>}</td>
              <td className="actions"><button type="button" onClick={() => setSel(c)}>{t("Orders")}</button><button type="button" className={c.status === 'active' ? 'danger' : ''} onClick={() => toggle(c)}>{c.status === 'active' ? t('Disable') : t('Enable')}</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? t('{name} — orders', { name: sel.name }) : ''} wide>
        {theirs.length === 0 ? <p className="muted">{t("No orders yet.")}</p> : <ul className="mini mini--orders">{theirs.map(o => <li key={o.id}><Link to={`/admin/orders/${o.id}`} onClick={() => setSel(null)}><b>{o.id}</b><span>{fmtDate(o.createdAt)}</span><StatusBadge status={o.status} /><em>{money(o.total)}</em></Link></li>)}</ul>}
      </Modal>
    </>
  );
}

/* ---------------- coupons ---------------- */
const BLANK_C = { code: '', type: 'percent', value: 10, minSubtotal: 0, usageLimit: 0, expiresAt: '', active: true, note: '' };
export function Coupons() {
  const { data, error, loading } = useData(listCoupons);
  const { showToast } = useStore();
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState(BLANK_C);
  const op = useAsync();
  const open = c => { setF(c ? { ...c, expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : '' } : BLANK_C); setEdit(c ? c.id : 'new'); op.clear(); };
  const save = async e => {
    e.preventDefault();
    const r = await op.run(() => saveCoupon({ ...f, id: edit === 'new' ? undefined : edit, expiresAt: f.expiresAt ? new Date(f.expiresAt + 'T23:59:59').getTime() : null }));
    if (r) { setEdit(null); showToast(<><span className="tick">✓</span><span>{t("Coupon saved")}</span></>, 2000); }
  };
  const err = k => (op.field === k ? op.error : '');
  const label = c => (c.type === 'percent' ? t('{n}% off', { n: c.value }) : c.type === 'fixed' ? t('{amount} off', { amount: money(c.value) }) : t('Free shipping'));
  return (
    <>
      <PageHead title={t("Coupons")} sub={t("Discount codes customers enter in the bag or at checkout.")} actions={<button className="btn btn--solid btn--sm" type="button" onClick={() => open(null)}><span>{t("+ New coupon")}</span></button>} />
      {error ? <p className="form-error">{error}</p> : loading ? <Spinner /> : (
        <div className="tablewrap"><table className="table">
          <thead><tr><th>{t("Code")}</th><th>{t("Discount")}</th><th>{t("Min. spend")}</th><th>{t("Used")}</th><th>{t("Expires")}</th><th>{t("Status")}</th><th /></tr></thead>
          <tbody>{data.map(c => (
            <tr key={c.id}><td><b className="code">{c.code}</b><small>{t(c.note)}</small></td><td>{label(c)}</td><td>{c.minSubtotal ? money(c.minSubtotal) : '—'}</td><td>{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td><td>{c.expiresAt ? fmtDate(c.expiresAt) : t('Never')}</td>
              <td>{c.active ? <Badge tone="ok">{t('active')}</Badge> : <Badge tone="dark">{t('off')}</Badge>}</td>
              <td className="actions"><button type="button" onClick={() => open(c)}>{t("Edit")}</button><button type="button" className="danger" onClick={async () => { await deleteCoupon(c.id); showToast(<span>{t('Coupon {code} deleted.', { code: c.code })}</span>, 2000); }}>{t("Delete")}</button></td></tr>
          ))}</tbody>
        </table></div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? t('New coupon') : t('Edit coupon')}>
        <form onSubmit={save} noValidate className="fields">
          <Field label={t("Code")} value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} error={err('code')} />
          <Field label={t("Type")} as="select" value={f.type} onChange={e => setF({ ...f, type: e.target.value })} error={err('type')}><option value="percent">{t("Percent off")}</option><option value="fixed">{t("Fixed amount off")}</option><option value="freeship">{t("Free standard shipping")}</option></Field>
          {f.type !== 'freeship' && <Field label={f.type === 'percent' ? t('Percent (%)') : t('Amount (USD)')} type="number" min="0" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} error={err('value')} />}
          <Field label={t("Minimum spend (USD)")} type="number" min="0" value={f.minSubtotal} onChange={e => setF({ ...f, minSubtotal: e.target.value })} />
          <Field label={t("Usage limit (0 = unlimited)")} type="number" min="0" value={f.usageLimit} onChange={e => setF({ ...f, usageLimit: e.target.value })} />
          <Field label={t("Expires")} type="date" value={f.expiresAt} onChange={e => setF({ ...f, expiresAt: e.target.value })} />
          <Field label={t("Internal note")} className="span2" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
          <label className="check span2"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} />{' '}{t("Active")}</label>
          {op.error && !op.field && <p className="form-error span2" role="alert">{op.error}</p>}
          <div className="modal__actions span2"><button className="btn btn--solid" type="submit" disabled={op.loading}><span>{op.loading ? t('Saving…') : t('Save coupon')}</span></button></div>
        </form>
      </Modal>
    </>
  );
}

/* ---------------- settings ---------------- */
export function Settings() {
  const { showToast } = useStore();
  const { logout } = useAuth();
  const s = readSettings();
  const [f, setF] = useState({ storeName: s.storeName, supportEmail: s.supportEmail, freeShippingFrom: s.freeShippingFrom, vndRate: s.vndRate || 25000, shipping: { ...s.shipping }, payments: { ...s.payments } });
  const [confirm, setConfirm] = useState(false);
  const op = useAsync();
  const save = async e => { e.preventDefault(); const r = await op.run(() => saveSettings(f)); if (r) showToast(<><span className="tick">✓</span><span>{t("Settings saved")}</span></>, 2000); };
  const reset = async () => { await resetDemoData(); logout(); location.hash = '#/login'; location.reload(); };

  return (
    <>
      <PageHead title={t("Settings")} sub={t("Store details, shipping and payment methods.")} />
      <form onSubmit={save} noValidate className="stack">
        <section className="card-a"><h2>{t("Store")}</h2>
          <div className="fields"><Field label={t("Store name")} value={f.storeName} onChange={e => setF({ ...f, storeName: e.target.value })} /><Field label={t("Support email")} type="email" value={f.supportEmail} onChange={e => setF({ ...f, supportEmail: e.target.value })} />
            <Field label={t('Vietnamese dong rate (VND per 1 USD)')} type="number" min="1000" step="100" value={f.vndRate} onChange={e => setF({ ...f, vndRate: e.target.value })} error={op.field === 'vndRate' ? op.error : ''} hint={t('Prices are stored in USD and shown in VND when the site is in Vietnamese.')} /></div></section>
        <section className="card-a"><h2>{t("Shipping")}</h2>
          <div className="fields fields--3">
            <Field label={t("Standard (USD)")} type="number" min="0" value={f.shipping.standard} onChange={e => setF({ ...f, shipping: { ...f.shipping, standard: e.target.value } })} error={op.field === 'shipping' ? op.error : ''} />
            <Field label={t("Express (USD)")} type="number" min="0" value={f.shipping.express} onChange={e => setF({ ...f, shipping: { ...f.shipping, express: e.target.value } })} />
            <Field label={t("Free standard shipping from (USD)")} type="number" min="0" value={f.freeShippingFrom} onChange={e => setF({ ...f, freeShippingFrom: e.target.value })} error={op.field === 'freeShippingFrom' ? op.error : ''} />
          </div></section>
        <section className="card-a"><h2>{t("Payment methods")}</h2>
          <div className="toggles">{PAYMENT_METHODS.map(m => (
            <label key={m.id} className="check"><input type="checkbox" checked={!!f.payments[m.id]} onChange={e => setF({ ...f, payments: { ...f.payments, [m.id]: e.target.checked } })} /> {m.icon} {t(m.label)}</label>
          ))}</div>
          {op.field === 'payments' && <p className="form-error">{op.error}</p>}
          <p className="muted small">{t("Payments are simulated in this demo. Connect Stripe / VNPay / MoMo on a real backend before going live.")}</p></section>
        {op.error && !op.field && <p className="form-error" role="alert">{op.error}</p>}
        <div><button className="btn btn--solid" type="submit" disabled={op.loading}><span>{op.loading ? t('Saving…') : t('Save settings')}</span></button></div>
      </form>

      <section className="card-a" style={{ marginTop: 22 }}><h2>{t("Who can do what")}</h2>
        <div className="tablewrap"><table className="table table--plain table--perm">
          <thead><tr><th>{t("Capability")}</th><th>{t("Guest")}</th><th>{t("Customer")}</th><th>{t("Admin")}</th></tr></thead>
          <tbody>{PERMISSIONS.map(p => <tr key={p.key}><td>{t(p.label)}</td>{['guest', 'customer', 'admin'].map(r => <td key={r} className="c">{p.roles.includes(r) ? <span className="yes">✓</span> : <span className="no">—</span>}</td>)}</tr>)}</tbody>
        </table></div></section>

      <section className="card-a danger-zone" style={{ marginTop: 22 }}><h2>{t("Demo data")}</h2><p className="muted">{t("Everything lives in this browser. Reset to restore the sample products, customers and orders.")}</p>
        <button className="btn btn--ghost btn--danger btn--sm" type="button" onClick={() => setConfirm(true)}><span>{t("Reset demo data")}</span></button></section>
      <Modal open={confirm} onClose={() => setConfirm(false)} title={t("Reset all demo data?")}>
        <p className="muted">{t("Products, orders, customers and coupons return to their defaults, and you'll be signed out.")}</p>
        <div className="modal__actions"><button className="btn btn--solid btn--danger" type="button" onClick={reset}><span>{t("Reset")}</span></button><button className="btn btn--ghost" type="button" onClick={() => setConfirm(false)}><span>{t("Cancel")}</span></button></div>
      </Modal>
    </>
  );
}
