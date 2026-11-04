import { ApiError, db, persist, resetDb, sleep } from './db.js';
import { requireAdmin } from './auth.js';
import { t } from '../i18n/index.js';

export const readSettings = () => db().settings;

export async function saveSettings(patch) {
  await sleep(220);
  requireAdmin();
  const s = db().settings;
  const free = Number(patch.freeShippingFrom);
  if (!(free >= 0)) throw new ApiError(t('Free-shipping threshold must be 0 or more.'), 422, 'freeShippingFrom');
  const std = Number(patch.shipping?.standard), exp = Number(patch.shipping?.express);
  if (!(std >= 0) || !(exp >= 0)) throw new ApiError(t('Shipping fees must be 0 or more.'), 422, 'shipping');
  if (!Object.values(patch.payments || {}).some(Boolean)) throw new ApiError(t('Keep at least one payment method enabled.'), 422, 'payments');
  const rate = Number(patch.vndRate ?? s.vndRate);
  if (!(rate >= 1000)) throw new ApiError(t('Exchange rate must be at least 1,000 VND per USD.'), 422, 'vndRate');
  Object.assign(s, { vndRate: rate, storeName: String(patch.storeName || s.storeName).trim(), supportEmail: String(patch.supportEmail || s.supportEmail).trim(), freeShippingFrom: free, shipping: { standard: std, express: exp }, payments: { ...s.payments, ...patch.payments } });
  persist();
  return s;
}

export async function resetDemoData() { requireAdmin(); await resetDb(); }
