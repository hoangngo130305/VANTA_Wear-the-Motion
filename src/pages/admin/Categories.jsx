import { useMemo, useState } from 'react';
import { deleteCategory, moveCategory, readCategories, saveCategory } from '../../api/categories.js';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useStore } from '../../context/StoreContext.jsx';
import { PageHead } from '../../components/admin/AdminLayout.jsx';
import { Badge, Field, Modal, useAsync } from '../../components/ui/index.jsx';
import { t, tc } from '../../i18n/index.js';

const BLANK = { name: { en: '', vi: '' }, kind: 'g', active: true };

/** Product categories: they feed the Shop filters, the header mega menu and the product form. */
export default function Categories() {
  const { version, products } = useCatalog();
  const { showToast } = useStore();
  const list = useMemo(() => readCategories({ includeInactive: true }), [version]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState(BLANK);
  const [del, setDel] = useState(null);
  const op = useAsync();
  const used = id => products.filter(p => p.category === id).length;

  const open = c => { setF(c ? { ...c, name: { ...c.name } } : BLANK); setEdit(c ? c.id : 'new'); op.clear(); };
  const save = async e => {
    e.preventDefault();
    const ok = await op.run(() => saveCategory({ ...f, id: edit === 'new' ? undefined : edit }));
    if (ok) { setEdit(null); showToast(<><span className="tick">✓</span><span>{t('Category saved')}</span></>, 2000); }
  };
  const toggle = async c => { try { await saveCategory({ ...c, active: !c.active }); } catch (e) { showToast(<span>{e.message}</span>); } };
  const confirmDelete = async () => {
    try { await deleteCategory(del.id); showToast(<span>{t('Category deleted')}</span>, 2000); } catch (e) { showToast(<span>{e.message}</span>, 4200); }
    setDel(null);
  };
  const err = k => (op.field === k ? op.error : '');

  return (
    <>
      <PageHead title={t('Categories')} sub={t('Shown in the Shop filters, the header menu and the product form.')} actions={<button className="btn btn--solid btn--sm" type="button" onClick={() => open(null)}><span>{t('+ New category')}</span></button>} />
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>{t('Order')}</th><th>{t('Category')}</th><th>{t('Contains')}</th><th>{t('Products')}</th><th>{t('Visible')}</th><th /></tr></thead>
          <tbody>
            {list.map((c, i) => (
              <tr key={c.id}>
                <td><div className="cms__ctl"><button type="button" aria-label={t('Move up')} disabled={i === 0} onClick={() => moveCategory(c.id, -1)}>↑</button><button type="button" aria-label={t('Move down')} disabled={i === list.length - 1} onClick={() => moveCategory(c.id, 1)}>↓</button></div></td>
                <td><b>{tc(c.name)}</b><small>{c.name.vi && c.name.vi !== c.name.en ? `${c.name.en} · ${c.name.vi}` : c.name.en} · /{c.id}</small></td>
                <td><Badge tone={c.kind === 's' ? 'info' : 'neutral'}>{c.kind === 's' ? t('Footwear') : t('Apparel')}</Badge></td>
                <td>{used(c.id)}</td>
                <td><label className="switch"><input type="checkbox" checked={c.active} onChange={() => toggle(c)} aria-label={t('Visible')} /><i /></label></td>
                <td className="actions"><button type="button" onClick={() => open(c)}>{t('Edit')}</button><button type="button" className="danger" onClick={() => setDel(c)}>{t('Delete')}</button></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="6" className="muted center-cell">{t('No categories yet.')}</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? t('New category') : t('Edit category')}>
        <form onSubmit={save} noValidate className="fields">
          <Field label={t('Name (English)')} className="span2" value={f.name.en} onChange={e => setF({ ...f, name: { ...f.name, en: e.target.value } })} error={err('name')} />
          <Field label={t('Name (Tiếng Việt)')} className="span2" value={f.name.vi} onChange={e => setF({ ...f, name: { ...f.name, vi: e.target.value } })} hint={t('Leave empty to use the English name.')} />
          <Field label={t('Contains')} as="select" className="span2" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })} error={err('kind')} hint={t('Footwear uses EU sizes 40–46; apparel uses S–XL.')}>
            <option value="g">{t('Apparel')}</option><option value="s">{t('Footwear')}</option>
          </Field>
          <label className="check span2"><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> {t('Visible in the shop')}</label>
          {op.error && !op.field && <p className="form-error span2" role="alert">{op.error}</p>}
          <div className="modal__actions span2"><button className="btn btn--solid" type="submit" disabled={op.loading}><span>{op.loading ? t('Saving…') : t('Save category')}</span></button></div>
        </form>
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title={t('Delete category?')}>
        <p className="muted">{del && used(del.id) ? t('{n} product(s) still use this category. Move or delete them first.', { n: used(del.id) }) : t('“{name}” will be removed from the menu and the filters.', { name: del ? tc(del.name) : '' })}</p>
        <div className="modal__actions"><button className="btn btn--solid btn--danger" type="button" onClick={confirmDelete}><span>{t('Delete')}</span></button><button className="btn btn--ghost" type="button" onClick={() => setDel(null)}><span>{t('Cancel')}</span></button></div>
      </Modal>
    </>
  );
}
