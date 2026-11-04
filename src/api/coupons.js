import { ApiError, db, persist, sleep } from './db.js';
import { randomId } from './crypto.js';
import { requireAdmin } from './auth.js';
import { t, money } from '../i18n/index.js';

/** Pure check used by both the cart preview and createOrder. Returns {code, type, value, discount, freeShip}. */
export function evaluateCoupon(code, subtotal) {
  const c = db().coupons.find(x => x.code === String(code || '').trim().toUpperCase());
  if (!c || !c.active) throw new ApiError(t('That code is not valid.'), 422, 'coupon');
  if (c.expiresAt && c.expiresAt < Date.now()) throw new ApiError(t('That code has expired.'), 422, 'coupon');
  if (c.usageLimit && c.used >= c.usageLimit) throw new ApiError(t('That code has been fully redeemed.'), 422, 'coupon');
  if (subtotal < c.minSubtotal) throw new ApiError(t('Spend {amount} or more to use {code}.', { amount: money(c.minSubtotal), code: c.code }), 422, 'coupon');
  let discount = 0;
  if (c.type === 'percent') discount = Math.round(subtotal * c.value) / 100;
  if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
  return { code: c.code, type: c.type, value: c.value, discount, freeShip: c.type === 'freeship', note: c.note };
}

export async function previewCoupon(code, subtotal) { await sleep(250); return evaluateCoupon(code, subtotal); }

/* ---------- admin CRUD ---------- */
export async function listCoupons() { await sleep(150); requireAdmin(); return db().coupons.map(c => ({ ...c })); }

export async function saveCoupon(input) {
  await sleep(220);
  requireAdmin();
  const code = String(input.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new ApiError(t('Code: 3–20 letters, numbers, - or _.'), 422, 'code');
  if (!['percent', 'fixed', 'freeship'].includes(input.type)) throw new ApiError(t('Pick a discount type.'), 422, 'type');
  const value = Number(input.value) || 0;
  if (input.type === 'percent' && !(value > 0 && value <= 100)) throw new ApiError(t('Percent must be between 1 and 100.'), 422, 'value');
  if (input.type === 'fixed' && !(value > 0)) throw new ApiError(t('Amount must be greater than 0.'), 422, 'value');
  const dup = db().coupons.find(c => c.code === code && c.id !== input.id);
  if (dup) throw new ApiError(t('A coupon with this code already exists.'), 409, 'code');
  const data = { code, type: input.type, value, minSubtotal: Math.max(0, Number(input.minSubtotal) || 0), expiresAt: input.expiresAt || null, usageLimit: Math.max(0, Math.floor(Number(input.usageLimit) || 0)), active: input.active !== false, note: input.note || '' };
  const ex = input.id && db().coupons.find(c => c.id === input.id);
  if (ex) Object.assign(ex, data); else db().coupons.unshift({ id: 'c_' + randomId(6), used: 0, ...data });
  persist();
  return true;
}

export async function deleteCoupon(id) {
  await sleep(150);
  requireAdmin();
  db().coupons = db().coupons.filter(c => c.id !== id);
  persist();
  return true;
}
