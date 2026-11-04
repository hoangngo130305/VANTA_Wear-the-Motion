import { ApiError, db, persist, sleep } from './db.js';
import { randomId } from './crypto.js';
import { requireAdmin, requireUser, sessionUser } from './auth.js';
import { t } from '../i18n/index.js';

export const GARMENT_SIZES = ['S', 'M', 'L', 'XL'];
export const SHOE_SIZES = ['40', '41', '42', '43', '44', '45', '46'];
export const AUDIENCES = ['men', 'women', 'unisex'];

/** synchronous read used by the catalog context (kept fresh through subscribeDb) */
export function readProducts({ includeInactive = false } = {}) {
  const list = db().products.filter(p => includeInactive || p.active);
  const rating = {};
  db().reviews.forEach(r => { (rating[r.productId] ||= []).push(r.rating); });
  return list.map(p => {
    const rs = rating[p.id] || [];
    return { ...p, rating: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0, reviewCount: rs.length };
  });
}

export const totalStock = p => Object.values(p.stock || {}).reduce((a, b) => a + b, 0);

/** keep only non-empty Vietnamese fields */
function cleanI18n(i) {
  const vi = {};
  for (const k of ['name', 'desc', 'color']) { const v = String(i?.vi?.[k] || '').trim(); if (v) vi[k] = v; }
  return Object.keys(vi).length ? { vi } : {};
}

function validate(p) {
  const name = String(p.name || '').trim();
  if (name.length < 2) throw new ApiError(t('Product name is required.'), 422, 'name');
  const price = Number(p.price);
  if (!(price > 0)) throw new ApiError(t('Price must be greater than 0.'), 422, 'price');
  const compareAt = p.compareAt === '' || p.compareAt == null ? null : Number(p.compareAt);
  if (compareAt != null && compareAt <= price) throw new ApiError(t('Compare-at price must be higher than the price.'), 422, 'compareAt');
  const cat = (db().categories || []).find(c => c.id === p.category);
  if (!cat) throw new ApiError(t('Choose a category.'), 422, 'category');
  if (!p.img) throw new ApiError(t('Add a product image.'), 422, 'img');
  const kind = cat.kind;
  const sizes = kind === 's' ? SHOE_SIZES : GARMENT_SIZES;
  const stock = Object.fromEntries(sizes.map(s => [s, Math.max(0, Math.floor(Number(p.stock?.[s]) || 0))]));
  return { name, price, compareAt, kind, sizes, stock, audience: AUDIENCES.includes(p.audience) ? p.audience : 'unisex' };
}

export async function createProduct(input) {
  await sleep(260);
  requireAdmin();
  const v = validate(input);
  let id = (input.id || v.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'p-' + randomId(5);
  while (db().products.some(p => p.id === id)) id += '-' + randomId(2);
  const product = {
    id, ...v, category: input.category, color: input.color || '', desc: String(input.desc || '').trim(),
    img: input.img, i18n: cleanI18n(input.i18n), views: null, tint: input.tint || '#e5e1d7', tags: input.tags || [], featured: !!input.featured, active: input.active !== false,
    rs: .3, rf: .714, createdAt: Date.now()
  };
  db().products.unshift(product);
  persist();
  return product;
}

export async function updateProduct(id, input) {
  await sleep(260);
  requireAdmin();
  const p = db().products.find(x => x.id === id);
  if (!p) throw new ApiError(t('Product not found.'), 404);
  const v = validate({ ...p, ...input });
  Object.assign(p, v, {
    color: input.color ?? p.color, desc: String(input.desc ?? p.desc).trim(), img: input.img ?? p.img, category: input.category ?? p.category,
    featured: input.featured ?? p.featured, active: input.active ?? p.active, tags: input.tags ?? p.tags,
    i18n: input.i18n !== undefined ? cleanI18n(input.i18n) : p.i18n
  });
  if (p.kind === 's' && p.views) p.views = null;
  persist();
  return p;
}

export async function deleteProduct(id) {
  await sleep(200);
  requireAdmin();
  const i = db().products.findIndex(x => x.id === id);
  if (i < 0) throw new ApiError(t('Product not found.'), 404);
  db().products.splice(i, 1);
  db().reviews = db().reviews.filter(r => r.productId !== id);
  persist();
  return true;
}

/* ---------- reviews ---------- */
export const listReviews = productId => db().reviews.filter(r => r.productId === productId).sort((a, b) => b.createdAt - a.createdAt);

export async function saveReview(productId, { rating, title, body }) {
  await sleep(300);
  const u = requireUser();
  rating = Math.round(Number(rating));
  if (!(rating >= 1 && rating <= 5)) throw new ApiError(t('Pick a star rating.'), 422, 'rating');
  body = String(body || '').trim();
  if (body.length < 10) throw new ApiError(t('Tell us a bit more (at least 10 characters).'), 422, 'body');
  const verified = db().orders.some(o => o.userId === u.id && o.status !== 'cancelled' && o.items.some(i => i.productId === productId));
  const existing = db().reviews.find(r => r.productId === productId && r.userId === u.id);
  const data = { productId, userId: u.id, userName: u.name, rating, title: String(title || '').trim(), body, verified, createdAt: Date.now() };
  if (existing) Object.assign(existing, data); else db().reviews.push({ id: 'r_' + randomId(8), ...data });
  persist();
  return true;
}

export const hasPurchased = (userId, productId) => db().orders.some(o => o.userId === userId && o.status === 'delivered' && o.items.some(i => i.productId === productId));
export { sessionUser };
