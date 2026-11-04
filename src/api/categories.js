import { ApiError, db, persist, sleep } from './db.js';
import { requireAdmin } from './auth.js';
import { t } from '../i18n/index.js';

/** active categories, in display order (sync read for the catalog context) */
export const readCategories = ({ includeInactive = false } = {}) =>
  [...(db().categories || [])].filter(c => includeInactive || c.active).sort((a, b) => a.order - b.order);

const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function clean(input) {
  const en = String(input.name?.en || '').trim(), vi = String(input.name?.vi || '').trim();
  if (en.length < 2) throw new ApiError(t('Category name (English) is required.'), 422, 'name');
  if (!['g', 's'].includes(input.kind)) throw new ApiError(t('Choose what the category contains.'), 422, 'kind');
  return { name: { en, vi }, kind: input.kind, active: input.active !== false };
}

export async function saveCategory(input) {
  await sleep(200);
  requireAdmin();
  const data = clean(input);
  const list = db().categories;
  if (input.id) {
    const c = list.find(x => x.id === input.id);
    if (!c) throw new ApiError(t('Category not found.'), 404);
    if (c.kind !== data.kind && db().products.some(p => p.category === c.id)) throw new ApiError(t('The type cannot change while products use this category.'), 409, 'kind');
    Object.assign(c, data);
  } else {
    let id = slug(data.name.en) || 'category';
    while (list.some(x => x.id === id)) id += '-2';
    list.push({ id, order: Math.max(0, ...list.map(x => x.order)) + 1, ...data });
  }
  persist();
  return true;
}

export async function moveCategory(id, dir) {
  await sleep(100);
  requireAdmin();
  const list = readCategories({ includeInactive: true });
  const i = list.findIndex(c => c.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return false;
  [list[i].order, list[j].order] = [list[j].order, list[i].order];
  persist();
  return true;
}

export async function deleteCategory(id) {
  await sleep(150);
  requireAdmin();
  const used = db().products.filter(p => p.category === id).length;
  if (used) throw new ApiError(t('{n} product(s) still use this category. Move or delete them first.', { n: used }), 409);
  db().categories = db().categories.filter(c => c.id !== id);
  persist();
  return true;
}
