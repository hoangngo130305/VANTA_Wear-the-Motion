import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useStore } from '../../context/StoreContext.jsx';
import * as api from '../../api/auth.js';
import ProductCard from '../../components/ProductCard.jsx';
import { Empty, Field, Modal, useAsync } from '../../components/ui/index.jsx';
import { t } from '../../i18n/index.js';

/* ---------------- wishlist ---------------- */
export function Wishlist() {
  const { user } = useAuth();
  const { byId } = useCatalog();
  const list = user.wishlist.map(id => byId[id]).filter(Boolean);
  return (
    <div className="panel">
      <div className="panel__head"><h2>{t("Wishlist")}</h2><small className="muted">{t('{n} saved', { n: list.length })}</small></div>
      {list.length === 0
        ? <Empty title={t("Nothing saved yet")} text={t('Tap the heart on any product to keep it here.')} action={<Link className="btn btn--solid" to="/shop"><span>{t("Browse the shop")}</span></Link>} />
        : <div className="grid grid--tight">{list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>}
    </div>
  );
}

/* ---------------- addresses ---------------- */
const BLANK = { label: 'Home', name: '', phone: '', line1: '', city: '', province: '', zip: '', country: 'Vietnam', isDefault: false };

export function Addresses() {
  const { user, setUser } = useAuth();
  const { showToast } = useStore();
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState(BLANK);
  const op = useAsync();

  const open = a => { setF(a ? { ...a } : { ...BLANK, name: user.name, phone: user.phone || '' }); setEdit(a ? a.id : 'new'); op.clear(); };
  const save = async e => {
    e.preventDefault();
    const u = await op.run(() => api.saveAddress({ ...f, id: edit === 'new' ? undefined : edit }));
    if (u) { setUser(u); setEdit(null); showToast(<><span className="tick">✓</span><span>{t("Address saved")}</span></>, 2000); }
  };
  const remove = async id => { const u = await api.deleteAddress(id); setUser(u); };
  const fld = k => ({ value: f[k], onChange: e => setF({ ...f, [k]: e.target.value }), error: op.field === k ? op.error : '' });

  return (
    <div className="panel">
      <div className="panel__head"><h2>{t("Addresses")}</h2><button className="btn btn--solid btn--sm" type="button" onClick={() => open(null)}><span>{t("Add address")}</span></button></div>
      {user.addresses.length === 0 ? <Empty title={t("No saved addresses")} text={t('Add one to speed up checkout.')} /> : (
        <div className="addrs">
          {user.addresses.map(a => (
            <div className="addr" key={a.id}>
              <b>{a.label} {a.isDefault && <em className="badge badge--lime">{t("Default")}</em>}</b>
              <p>{a.name}<br />{a.phone}<br />{a.line1}, {a.city}, {a.province} {a.zip}<br />{t(a.country)}</p>
              <div className="row gap"><button type="button" className="link" onClick={() => open(a)}><span>{t("Edit")}</span></button><button type="button" className="ci__rm" onClick={() => remove(a.id)}>{t("Delete")}</button></div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? t('New address') : t('Edit address')} wide>
        <form onSubmit={save} noValidate className="fields">
          <Field label={t("Label")} {...fld('label')} /><Field label={t("Full name")} {...fld('name')} />
          <Field label={t("Phone")} type="tel" {...fld('phone')} /><Field label={t("Postal code")} {...fld('zip')} />
          <Field label={t("Address")} className="span2" {...fld('line1')} />
          <Field label={t("City / District")} {...fld('city')} /><Field label={t("Province")} {...fld('province')} />
          <label className="check span2"><input type="checkbox" checked={f.isDefault} onChange={e => setF({ ...f, isDefault: e.target.checked })} />{' '}{t("Make this my default address")}</label>
          {op.error && !op.field && <p className="form-error span2" role="alert">{op.error}</p>}
          <div className="modal__actions span2"><button className="btn btn--solid" type="submit" disabled={op.loading}><span>{op.loading ? t('Saving…') : t('Save address')}</span></button></div>
        </form>
      </Modal>
    </div>
  );
}

/* ---------------- profile & security ---------------- */
export function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useStore();
  const p = useAsync(), pw = useAsync();
  const [f, setF] = useState({ name: user.name, phone: user.phone || '' });
  const [c, setC] = useState({ current: '', next: '' });

  const saveProfile = async e => { e.preventDefault(); const u = await p.run(() => api.updateProfile(f)); if (u) { setUser(u); showToast(<><span className="tick">✓</span><span>{t("Profile updated")}</span></>, 2000); } };
  const savePw = async e => { e.preventDefault(); const ok = await pw.run(() => api.changePassword(c)); if (ok) { setC({ current: '', next: '' }); showToast(<><span className="tick">✓</span><span>{t("Password changed")}</span></>, 2200); } };

  return (
    <>
      <form className="panel" onSubmit={saveProfile} noValidate>
        <h2>{t("Profile")}</h2>
        <div className="fields">
          <Field label={t("Full name")} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={p.field === 'name' ? p.error : ''} />
          <Field label={t("Phone")} type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
          <Field label={t("Email")} value={user.email} disabled hint={t("Email can't be changed in this demo.")} className="span2" />
        </div>
        {p.error && !p.field && <p className="form-error" role="alert">{p.error}</p>}
        <button className="btn btn--solid" type="submit" disabled={p.loading}><span>{p.loading ? t('Saving…') : t('Save changes')}</span></button>
      </form>
      <form className="panel" onSubmit={savePw} noValidate>
        <h2>{t("Change password")}</h2>
        <div className="fields">
          <Field label={t("Current password")} type="password" autoComplete="current-password" value={c.current} onChange={e => setC({ ...c, current: e.target.value })} error={pw.field === 'current' ? pw.error : ''} />
          <Field label={t("New password")} type="password" autoComplete="new-password" value={c.next} onChange={e => setC({ ...c, next: e.target.value })} error={pw.field === 'next' ? pw.error : ''} hint={t("8+ characters with upper, lower case and a number.")} />
        </div>
        {pw.error && !pw.field && <p className="form-error" role="alert">{pw.error}</p>}
        <button className="btn btn--solid" type="submit" disabled={pw.loading}><span>{pw.loading ? t('Updating…') : t('Update password')}</span></button>
      </form>
    </>
  );
}
