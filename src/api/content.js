import { ApiError, db, persist, sleep } from './db.js';
import { requireAdmin } from './auth.js';
import { DEFAULT_CONTENT } from '../content/defaults.js';
import { t } from '../i18n/index.js';

const clone = o => JSON.parse(JSON.stringify(o));

/** defaults ← stored overrides. Objects merge key by key (so new default fields appear), arrays are replaced whole. */
function merge(def, over) {
  if (over === undefined || over === null) return def;
  if (Array.isArray(def)) return Array.isArray(over) ? over : def;
  if (def && typeof def === 'object') {
    const out = {};
    for (const k of Object.keys(def)) out[k] = k in over ? merge(def[k], over[k]) : def[k];
    return out;
  }
  return over;
}

export const SECTIONS = Object.keys(DEFAULT_CONTENT);

export function readContent() {
  const stored = db().content || {};
  const out = {};
  for (const k of SECTIONS) out[k] = merge(DEFAULT_CONTENT[k], stored[k]);
  return out;
}

export const defaultSection = key => clone(DEFAULT_CONTENT[key]);
export const isCustomised = key => !!(db().content || {})[key];

export async function saveContentSection(key, value) {
  await sleep(220);
  requireAdmin();
  if (!SECTIONS.includes(key)) throw new ApiError(t('Unknown content section.'), 404);
  const s = db();
  s.content = { ...(s.content || {}), [key]: clone(value) };
  persist();
  return true;
}

export async function resetContentSection(key) {
  await sleep(150);
  requireAdmin();
  const s = db();
  const next = { ...(s.content || {}) };
  delete next[key];
  s.content = next;
  persist();
  return true;
}

/** rough size of what the browser is storing (localStorage is limited to ~5 MB) */
export function storageUsage() {
  try {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); bytes += (k.length + (localStorage.getItem(k) || '').length) * 2; }
    return { used: bytes, limit: 5 * 1024 * 1024 };
  } catch { return { used: 0, limit: 5 * 1024 * 1024 }; }
}
