import { buildSeed, PRODUCT_VI, CAT_ID, AUDIENCE, seedCategories } from './seed.js';
import { t } from '../i18n/index.js';

/**
 * Tiny persistent "database" in localStorage. Every API module reads/writes through here,
 * so swapping this layer (and the api/* functions) for a real backend is a local change.
 */
const KEY = 'vanta-db-v2';
let state = null;
const listeners = new Set();

export async function initDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.version >= 2 && s?.version <= 4) { state = migrate(s); return; }
    }
  } catch { /* corrupted → reseed */ }
  state = await buildSeed();
  persist();
}

/** v2 → v3: content store, VND rate and Vietnamese product copy (existing data is kept) */
function migrate(s) {
  if (s.version === 4) return s;
  s.version = 4;
  s.content = s.content || {};
  s.settings.vndRate = s.settings.vndRate || 25000;
  s.products.forEach(p => { if (!p.i18n) p.i18n = PRODUCT_VI[p.id] ? { vi: PRODUCT_VI[p.id] } : {}; });
  // v4: categories become records (products point at them by id) and products get an audience
  if (!s.categories) s.categories = seedCategories();
  s.products.forEach(p => { p.category = CAT_ID[p.category] || p.category; p.audience = p.audience || AUDIENCE[p.id] || 'unisex'; });
  if (!s.coupons.some(c => c.code === 'LOOK10')) s.coupons.push({ id: 'c4', code: 'LOOK10', type: 'percent', value: 10, minSubtotal: 0, expiresAt: null, usageLimit: 0, used: 0, active: true, note: 'Runway bundle — full look' });
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export const db = () => state;
export const sleep = (ms = 220) => new Promise(r => setTimeout(r, ms));

export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { throw new ApiError(t('Storage is full. Remove some product images or reset the demo data.'), 507); }
  listeners.forEach(f => f());
}

export function subscribeDb(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function resetDb() {
  state = await buildSeed();
  localStorage.removeItem('vanta-session');
  persist();
}

// keep several tabs in sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === KEY && e.newValue) { try { state = JSON.parse(e.newValue); listeners.forEach(f => f()); } catch { /* ignore */ } }
  });
}

export class ApiError extends Error {
  constructor(message, status = 400, field) { super(message); this.status = status; this.field = field; }
}
