import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GARMENT_SIZES, SHOE_SIZES, thumb } from '../../data/catalog.js';
import { readCategories } from '../../api/categories.js';
import { tc } from '../../i18n/index.js';
import { createProduct, deleteProduct, readProducts, totalStock, updateProduct } from '../../api/products.js';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useStore } from '../../context/StoreContext.jsx';
import { PageHead } from '../../components/admin/AdminLayout.jsx';
import { Badge, Field, Modal, useAsync } from '../../components/ui/index.jsx';
import { fileToDataUrl } from '../../lib/image.js';
import { money } from '../../lib/utils.js';
import { pCategory, pName } from '../../i18n/helpers.js';
import { t } from '../../i18n/index.js';

const BLANK = { name: '', category: '', audience: 'unisex', price: '', compareAt: '', color: '', desc: '', img: '', stock: {}, featured: false, active: true };

export default function Products() {
  const { version } = useCatalog();
  const { showToast } = useStore();
  const all = useMemo(() => readProducts({ includeInactive: true }), [version]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const cats = readCategories({ includeInactive: true });
  const [edit, setEdit] = useState(null);       // null | 'new' | product id
  const [del, setDel] = useState(null);
  const list = all.filter(p => (cat === 'all' || p.category === cat) && (!q || (p.name + p.category).toLowerCase().includes(q.toLowerCase())));

  const toggle = async p => {
    try { await updateProduct(p.id, { active: !p.active }); showToast(<span>{t(p.active ? '{name} is now hidden.' : '{name} is now live.', { name: pName(p) })}</span>, 2000); }
    catch (e) { showToast(<span>{e.message}</span>); }
  };
  const confirmDelete = async () => {
    try { await deleteProduct(del.id); showToast(<><span className="tick">✓</span><span>{t('{name} deleted', { name: pName(del) })}</span></>, 2200); } catch (e) { showToast(<span>{e.message}</span>); }
    setDel(null);
  };

  return (
    <>
      <PageHead title={t("Products")} sub={t('{n} products · {hidden} hidden', { n: all.length, hidden: all.filter(p => !p.active).length })} actions={<button className="btn btn--solid btn--sm" type="button" onClick={() => setEdit('new')}><span>{t("+ New product")}</span></button>} />
      <div className="adm__filters">
        <input type="search" placeholder={t("Search products…")} value={q} onChange={e => setQ(e.target.value)} aria-label={t("Search products")} />
        <select value={cat} onChange={e => setCat(e.target.value)} aria-label={t("Category")}><option value="all">{t("All categories")}</option>{cats.map(c => <option key={c.id} value={c.id}>{tc(c.name)}</option>)}</select>
      </div>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>{t("Product")}</th><th>{t("Category")}</th><th>{t("Price")}</th><th>{t("Stock")}</th><th>{t("Status")}</th><th /></tr></thead>
          <tbody>
            {list.map(p => {
              const n = totalStock(p);
              return (
                <tr key={p.id}>
                  <td><div className="pcell"><img src={thumb(p)} alt="" /><div><b>{pName(p)}</b><small>{p.id}</small></div></div></td>
                  <td>{pCategory(p)}</td>
                  <td>{money(p.price)}{p.compareAt && <small className="muted"> <s>{money(p.compareAt)}</s></small>}</td>
                  <td>{n === 0 ? <Badge tone="dark">{t("Sold out")}</Badge> : n <= 8 ? <Badge tone="warn">{t('{n} left', { n })}</Badge> : <span>{n}</span>}</td>
                  <td><label className="switch"><input type="checkbox" checked={p.active} onChange={() => toggle(p)} aria-label={t('{name} visible', { name: pName(p) })} /><i /></label></td>
                  <td className="actions"><Link to={`/product/${p.id}`} target="_blank">{t("View")}</Link><button type="button" onClick={() => setEdit(p.id)}>{t("Edit")}</button><button type="button" className="danger" onClick={() => setDel(p)}>{t("Delete")}</button></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan="6" className="muted center-cell">{t("No products match.")}</td></tr>}
          </tbody>
        </table>
      </div>

      {edit && <ProductForm key={edit} id={edit} onClose={() => setEdit(null)} />}
      <Modal open={!!del} onClose={() => setDel(null)} title={t("Delete product?")}>
        <p className="muted">{t("“{name}” and its reviews will be removed. Past orders keep their line items. This can't be undone.", { name: del?.name })}</p>
        <div className="modal__actions"><button className="btn btn--solid btn--danger" type="button" onClick={confirmDelete}><span>{t("Delete")}</span></button><button className="btn btn--ghost" type="button" onClick={() => setDel(null)}><span>{t("Cancel")}</span></button></div>
      </Modal>
    </>
  );
}

function ProductForm({ id, onClose }) {
  const { showToast } = useStore();
  const existing = id !== 'new' ? readProducts({ includeInactive: true }).find(p => p.id === id) : null;
  const [f, setF] = useState(existing ? { ...BLANK, ...existing, compareAt: existing.compareAt ?? '' } : BLANK);
  const op = useAsync();
  const [imgErr, setImgErr] = useState('');
  const file = useRef(null);
  const cats = readCategories({ includeInactive: true });
  const sizes = cats.find(c => c.id === f.category)?.kind === 's' ? SHOE_SIZES : GARMENT_SIZES;
  const setVi = (k, v) => setF(x => ({ ...x, i18n: { vi: { ...(x.i18n?.vi || {}), [k]: v } } }));

  const pick = async e => {
    const fl = e.target.files?.[0];
    if (!fl) return;
    setImgErr('');
    try { setF(x => ({ ...x, img: '' })); const url = await fileToDataUrl(fl); setF(x => ({ ...x, img: url })); }
    catch (err) { setImgErr(err.message); }
  };
  const submit = async e => {
    e.preventDefault();
    const payload = { ...f, price: f.price, compareAt: f.compareAt };
    const r = await op.run(() => (existing ? updateProduct(existing.id, payload) : createProduct(payload)));
    if (r) { showToast(<><span className="tick">✓</span><span>{t('{name} saved', { name: r.name })}</span></>, 2200); onClose(); }
  };
  const err = k => (op.field === k ? op.error : '');

  return (
    <Modal open onClose={onClose} title={existing ? t('Edit {name}', { name: existing.name }) : t('New product')} wide>
      <form onSubmit={submit} noValidate className="pform">
        <div className="pform__img">
          <div className={'drop' + (err('img') || imgErr ? ' has-error' : '')} onClick={() => file.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') file.current?.click(); }}>
            {f.img ? <img src={f.img.startsWith('data:') ? f.img : thumb(f)} alt={t("Preview")} /> : <span>{t('Click to upload')}<br /><small>{t("JPG / PNG / WebP · auto-resized")}</small></span>}
          </div>
          <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
          <Field label={t("…or image URL")} placeholder={t("https://")} value={f.img?.startsWith('data:') ? '' : f.img} onChange={e => setF({ ...f, img: e.target.value })} hint={t("Only use images you have the rights to.")} />
          {(err('img') || imgErr) && <small className="field__err">{err('img') || imgErr}</small>}
        </div>
        <div className="fields">
          <Field label={t("Name")} className="span2" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={err('name')} />
          <Field label={t("Category")} as="select" value={f.category} onChange={e => setF({ ...f, category: e.target.value, stock: {} })} error={err('category')}><option value="">—</option>{cats.map(c => <option key={c.id} value={c.id}>{tc(c.name)}</option>)}</Field>
          <Field label={t('Audience')} as="select" value={f.audience || 'unisex'} onChange={e => setF({ ...f, audience: e.target.value })}>{['men', 'women', 'unisex'].map(a => <option key={a} value={a}>{t(a === 'men' ? 'Men' : a === 'women' ? 'Women' : 'Unisex')}</option>)}</Field>
          <Field label={t("Colour")} value={f.color} onChange={e => setF({ ...f, color: e.target.value })} />
          <Field label={t("Price (USD)")} type="number" min="0" step="0.01" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} error={err('price')} />
          <Field label={t("Compare-at price (sale)")} type="number" min="0" step="0.01" value={f.compareAt} onChange={e => setF({ ...f, compareAt: e.target.value })} error={err('compareAt')} hint={t("Higher than price to show a sale badge.")} />
          <Field label={t("Description")} as="textarea" rows={3} className="span2" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />
          <Field label={t('Name (Tiếng Việt)')} className="span2" value={f.i18n?.vi?.name || ''} onChange={e => setVi('name', e.target.value)} hint={t('Leave empty to use the English name.')} />
          <Field label={t('Colour (Tiếng Việt)')} value={f.i18n?.vi?.color || ''} onChange={e => setVi('color', e.target.value)} />
          <span />
          <Field label={t('Description (Tiếng Việt)')} as="textarea" rows={3} className="span2" value={f.i18n?.vi?.desc || ''} onChange={e => setVi('desc', e.target.value)} />
          <div className="field span2"><label>{t("Stock by size")}</label>
            <div className="stockgrid">{sizes.map(s => <label key={s}><span>{s}</span><input type="number" min="0" value={f.stock?.[s] ?? 0} onChange={e => setF({ ...f, stock: { ...f.stock, [s]: e.target.value } })} /></label>)}</div>
          </div>
          <label className="check"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} />{' '}{t("Visible in the shop")}</label>
          <label className="check"><input type="checkbox" checked={f.featured} onChange={e => setF({ ...f, featured: e.target.checked })} />{' '}{t("Featured")}</label>
          {op.error && !op.field && <p className="form-error span2" role="alert">{op.error}</p>}
          <div className="modal__actions span2"><button className="btn btn--solid" type="submit" disabled={op.loading}><span>{op.loading ? t('Saving…') : t('Save product')}</span></button><button className="btn btn--ghost" type="button" onClick={onClose}><span>{t("Cancel")}</span></button></div>
        </div>
      </form>
    </Modal>
  );
}
