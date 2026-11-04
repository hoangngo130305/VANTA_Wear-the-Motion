import { db } from '../api/db.js';
import { isVi, t, tc } from './index.js';

/** product copy: English is canonical, Vietnamese lives in product.i18n.vi */
export const pName = p => (p ? (isVi() && p.i18n?.vi?.name) || p.name : '');
export const pDesc = p => (p ? (isVi() && p.i18n?.vi?.desc) || p.desc : '');
export const pColor = p => (p ? (isVi() && p.i18n?.vi?.color) || (p.color ? t(p.color) : '') : '');
/** category name from the category record (bilingual); falls back to the raw value */
export const categoryName = id => { const c = (db().categories || []).find(x => x.id === id); return c ? tc(c.name) : t(String(id)); };
export const pCategory = p => categoryName(p?.category);

/** localized name for a stored line item (cart / order): look the live product up, fall back to the saved name */
export function itemName(item) {
  const p = db().products.find(x => x.id === (item.productId || item.id));
  return p ? pName(p) : item.name;
}
