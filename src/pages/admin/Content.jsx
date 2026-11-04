import { useEffect, useRef, useState } from 'react';
import { GROUPS, LINKS, SCHEMA } from '../../content/schema.js';
import { defaultSection, isCustomised, resetContentSection, saveContentSection, storageUsage } from '../../api/content.js';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useStore } from '../../context/StoreContext.jsx';
import { PageHead } from '../../components/admin/AdminLayout.jsx';
import { Modal, useAsync } from '../../components/ui/index.jsx';
import { asset } from '../../data/catalog.js';
import { fileToDataUrl } from '../../lib/image.js';
import { t } from '../../i18n/index.js';

const clone = o => JSON.parse(JSON.stringify(o));
const blankOf = fields => {
  const o = {};
  fields.forEach(f => {
    if (f.type === 'text' || f.type === 'long') o[f.key] = { en: '', vi: '' };
    else if (f.type === 'bool') o[f.key] = false;
    else if (f.type === 'number') o[f.key] = 0;
    else if (f.type === 'list') o[f.key] = [];
    else if (f.type === 'group') o[f.key] = blankOf(f.fields);
    else o[f.key] = '';
  });
  return o;
};

/* ---------- one field ---------- */
function Loc({ field, value, onChange }) {
  const v = value && typeof value === 'object' ? value : { en: value || '', vi: '' };
  const Tag = field.type === 'long' ? 'textarea' : 'input';
  return (
    <div className="cms__loc">
      {['en', 'vi'].map(lc => (
        <label key={lc}><span className="cms__lang">{lc.toUpperCase()}</span>
          <Tag value={v[lc] || ''} rows={Tag === 'textarea' ? 3 : undefined} lang={lc} onChange={e => onChange({ ...v, [lc]: e.target.value })} />
        </label>
      ))}
    </div>
  );
}

function ImageField({ field, value, onChange }) {
  const input = useRef(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const pick = async e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErr(''); setBusy(true);
    try { onChange(await fileToDataUrl(f, { max: field.max || 1400, keepAlpha: !!field.keepAlpha, quality: 0.82 })); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <div className="cms__img">
      <div className="cms__thumb">{value ? <img src={asset(value)} alt="" /> : <span>{t('No image')}</span>}</div>
      <div className="cms__imgctl">
        <div className="row gap wrap-row">
          <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => input.current?.click()}><span>{busy ? t('Processing…') : value ? t('Replace image') : t('Upload image')}</span></button>
          {value && <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => onChange('')}><span>{t('Remove')}</span></button>}
        </div>
        <input type="text" value={value?.startsWith('data:') ? '' : value || ''} placeholder={value?.startsWith('data:') ? t('Uploaded image (stored in this browser)') : 'https://… or img/…'} onChange={e => onChange(e.target.value)} />
        {(err || field.hint) && <small className={err ? 'field__err' : 'field__hint'}>{err || t(field.hint)}</small>}
        <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      </div>
    </div>
  );
}

function Field({ field, value, onChange, products }) {
  const label = <span className="cms__label">{t(field.label)}</span>;
  const hint = field.hint && field.type !== 'image' ? <small className="field__hint">{t(field.hint)}</small> : null;
  switch (field.type) {
    case 'text': case 'long':
      return <div className="cms__field">{label}<Loc field={field} value={value} onChange={onChange} />{hint}</div>;
    case 'plain':
      return <div className="cms__field"><label>{label}<input value={value ?? ''} onChange={e => onChange(e.target.value)} /></label>{hint}</div>;
    case 'number':
      return <div className="cms__field"><label>{label}<input type="number" step="any" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} /></label></div>;
    case 'bool':
      return <label className="check cms__field">{<input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />}{t(field.label)}</label>;
    case 'color':
      return <div className="cms__field"><label>{label}<span className="cms__color"><input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)} /><input value={value || ''} onChange={e => onChange(e.target.value)} /></span></label></div>;
    case 'image':
      return <div className="cms__field">{label}<ImageField field={field} value={value} onChange={onChange} /></div>;
    case 'product':
      return <div className="cms__field"><label>{label}<select value={value || ''} onChange={e => onChange(e.target.value)}><option value="">—</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>;
    case 'link':
      return <div className="cms__field"><label>{label}<select value={value || ''} onChange={e => onChange(e.target.value)}>{LINKS.map(([k, l]) => <option key={k} value={k}>{t(l)}</option>)}</select></label></div>;
    case 'group':
      return <fieldset className="cms__group"><legend>{t(field.label)}</legend><Fields fields={field.fields} value={value || {}} onChange={onChange} products={products} /></fieldset>;
    case 'list':
      return <ListField field={field} value={value || []} onChange={onChange} products={products} />;
    default:
      return null;
  }
}

function Fields({ fields, value, onChange, products }) {
  return fields.map(f => (
    <Field key={f.key} field={f} value={value[f.key]} products={products} onChange={v => onChange({ ...value, [f.key]: v })} />
  ));
}

function ListField({ field, value, onChange, products }) {
  const primitive = field.of;
  const added = useRef(-1);   // the item that was just added opens itself
  const add = () => { added.current = value.length; onChange([...value, primitive ? '' : blankOf(field.fields)]); };
  const remove = i => onChange(value.filter((_, k) => k !== i));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= value.length) return; const n = [...value]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  const set = (i, v) => onChange(value.map((x, k) => (k === i ? v : x)));
  const full = field.max && value.length >= field.max;

  return (
    <div className="cms__list">
      <div className="cms__listhead"><span className="cms__label">{t(field.label)} <em>({value.length})</em></span></div>
      {value.map((item, i) => (
        <details key={i} className="cms__item" open={primitive || value.length <= 2} ref={el => { if (el && added.current === i) { el.open = true; added.current = -1; } }}>
          <summary>
            <b>{primitive ? (products.find(p => p.id === item)?.name || '—') : (field.itemLabel?.(item) || `#${i + 1}`)}</b>
            <span className="cms__ctl" onClick={e => e.preventDefault()}>
              <button type="button" aria-label={t('Move up')} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" aria-label={t('Move down')} disabled={i === value.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" aria-label={t('Remove')} className="danger" onClick={() => remove(i)}>✕</button>
            </span>
          </summary>
          <div className="cms__body">
            {primitive
              ? <Field field={{ type: primitive, label: field.label }} value={item} products={products} onChange={v => set(i, v)} />
              : <Fields fields={field.fields} value={item} products={products} onChange={v => set(i, v)} />}
          </div>
        </details>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" disabled={full} onClick={add}><span>+ {t(field.addLabel || 'Add item')}</span></button>
    </div>
  );
}

/* ---------- the screen ---------- */
export default function AdminContent() {
  const { content, products } = useCatalog();
  const { showToast } = useStore();
  const [sel, setSel] = useState('hero');
  const section = SCHEMA.find(s => s.id === sel);
  const [draft, setDraft] = useState(() => clone(content[sel]));
  const [confirm, setConfirm] = useState(false);
  const op = useAsync();
  const dirty = JSON.stringify(draft) !== JSON.stringify(content[sel]);
  const usage = storageUsage();

  useEffect(() => { setDraft(clone(content[sel])); op.clear(); }, [sel]);   // eslint-disable-line react-hooks/exhaustive-deps

  const choose = id => {
    if (id === sel) return;
    if (dirty && !window.confirm(t('You have unsaved changes in this section. Discard them?'))) return;
    setSel(id);
  };
  const save = async () => {
    const ok = await op.run(() => saveContentSection(sel, draft));
    if (ok) showToast(<><span className="tick">✓</span><span>{t('Content saved — the store is updated.')}</span></>, 2600);
  };
  const reset = async () => {
    await resetContentSection(sel);
    setDraft(defaultSection(sel)); setConfirm(false);
    showToast(<span>{t('Restored the default content.')}</span>, 2400);
  };

  return (
    <>
      <PageHead title={t('Content')} sub={t('Edit every text and image on the site — in English and Vietnamese.')} />
      <div className="cms">
        <nav className="cms__nav" aria-label={t('Content sections')}>
          {GROUPS.map(g => (
            <div key={g.id}>
              <h4>{t(g.title)}</h4>
              {SCHEMA.filter(s => s.group === g.id).map(s => (
                <button key={s.id} type="button" className={s.id === sel ? 'on' : ''} onClick={() => choose(s.id)}>
                  {t(s.title)}{isCustomised(s.id) && <i title={t('Customised')} />}
                </button>
              ))}
            </div>
          ))}
          <p className="cms__usage" title={t('Browser storage used')}>{t('Storage')}: {(usage.used / 1048576).toFixed(1)} / {(usage.limit / 1048576).toFixed(0)} MB</p>
        </nav>

        <section className="cms__main">
          <header className="cms__head">
            <div><h2>{t(section.title)}</h2><p className="muted">{t(section.desc)}</p></div>
            <div className="adm__actions">
              <a className="btn btn--ghost btn--sm" href={'#' + section.route} target="_blank" rel="noreferrer"><span>{t('Preview')} ↗</span></a>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setConfirm(true)}><span>{t('Reset to default')}</span></button>
              <button className="btn btn--solid btn--sm" type="button" disabled={!dirty || op.loading} onClick={save}><span>{op.loading ? t('Saving…') : dirty ? t('Save changes') : t('Saved')}</span></button>
            </div>
          </header>
          {op.error && <p className="form-error form-error--box" role="alert">{op.error}</p>}
          <div className="cms__form"><Fields key={sel} fields={section.fields} value={draft} products={products} onChange={setDraft} /></div>
        </section>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t('Reset this section?')}>
        <p className="muted">{t('Your edits in “{name}” are replaced by the original content.', { name: t(section.title) })}</p>
        <div className="modal__actions"><button className="btn btn--solid btn--danger" type="button" onClick={reset}><span>{t('Reset')}</span></button><button className="btn btn--ghost" type="button" onClick={() => setConfirm(false)}><span>{t('Cancel')}</span></button></div>
      </Modal>
    </>
  );
}
