import { createElement, Fragment } from 'react';
import vi from './vi.js';

/**
 * Tiny i18n layer.
 *  - t('English text', {vars})   UI strings: the English sentence IS the key; vi.js maps it to Vietnamese.
 *  - tc({en, vi})                content authored in both languages (CMS, product copy).
 *  - rich('A *word* here\nnew line')  content markup → React nodes (*x* = outlined emphasis, \n = line break).
 * The app re-mounts when the language changes (see App.jsx), so plain module functions are enough.
 */
export const LANGS = [{ code: 'en', label: 'English', short: 'EN' }, { code: 'vi', label: 'Tiếng Việt', short: 'VI' }];
const KEY = 'vanta-lang';

let lang = 'en';
try {
  const saved = localStorage.getItem(KEY);
  lang = saved === 'vi' || saved === 'en' ? saved : (navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en';
} catch { /* private mode */ }
if (typeof document !== 'undefined') document.documentElement.lang = lang;

let vndRate = 25000;
export const getLang = () => lang;
export const isVi = () => lang === 'vi';
export const locale = () => (lang === 'vi' ? 'vi-VN' : 'en-US');
export const setVndRate = r => { if (r > 0) vndRate = r; };
export const getVndRate = () => vndRate;

export function setLang(next) {
  if (next !== 'en' && next !== 'vi') return;
  lang = next;
  try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  document.documentElement.lang = next;
}

/** keys that had no Vietnamese entry (handy while testing: window.__i18nMissing) */
export const missing = new Set();
if (typeof window !== 'undefined') window.__i18nMissing = missing;

function fill(str, vars) {
  if (!vars) return str;
  const parts = str.split(/(\{\w+\})/g);
  const hasNode = Object.values(vars).some(v => v !== null && typeof v === 'object');
  if (!hasNode) return parts.map(p => { const m = /^\{(\w+)\}$/.exec(p); return m && m[1] in vars ? vars[m[1]] : p; }).join('');
  return createElement(Fragment, null, ...parts.map((p, i) => {
    const m = /^\{(\w+)\}$/.exec(p);
    return m && m[1] in vars ? createElement(Fragment, { key: i }, vars[m[1]]) : p;
  }));
}

export function t(key, vars) {
  if (typeof key !== 'string') return key;
  let s = key;
  if (lang === 'vi') {
    if (key in vi) s = vi[key];
    else if (/[A-Za-z]{3}/.test(key)) missing.add(key);
  }
  return fill(s, vars);
}

/** localized value from a {en, vi} object (falls back to English, then to a plain string) */
export function tc(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v.en || v.vi || '';
}

/** markup for editable headings: *emphasis* → <em>, newline → <br> */
export function rich(text) {
  const s = tc(text);
  const out = [];
  s.split('\n').forEach((line, li) => {
    if (li) out.push(createElement('br', { key: 'b' + li }));
    line.split(/(\*[^*]+\*)/g).forEach((seg, i) => {
      if (!seg) return;
      if (seg.length > 2 && seg[0] === '*' && seg[seg.length - 1] === '*') out.push(createElement('em', { key: `${li}-${i}` }, seg.slice(1, -1)));
      else out.push(seg);
    });
  });
  return out;
}

/** content string with {free} / {brand} style placeholders filled in */
export const fillText = (v, vars) => fill(tc(v), vars);

/* ---------- formatting ---------- */
export function money(n) {
  const v = Math.round(n * 100) / 100;
  if (lang === 'vi') return Math.round(v * vndRate).toLocaleString('vi-VN') + '₫';
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
}
export const fmtDate = (time, long = false) =>
  new Date(time).toLocaleString(locale(), long ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
export const fmtNumber = n => n.toLocaleString(locale());
