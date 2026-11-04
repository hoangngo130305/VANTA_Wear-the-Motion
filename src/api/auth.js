import { ApiError, db, persist, sleep } from './db.js';
import { hashPassword, randomId } from './crypto.js';
import { t } from '../i18n/index.js';

const SESSION = 'vanta-session';
const SESSION_MS = 7 * 86400000;
const attempts = new Map();   // email → {n, until}

export const publicUser = u => (u ? { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, status: u.status, addresses: u.addresses, wishlist: u.wishlist, createdAt: u.createdAt } : null);

/* ---------- session ---------- */
function readSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION));
    if (s && s.exp > Date.now()) return s;
  } catch { /* none */ }
  return null;
}
const startSession = userId => localStorage.setItem(SESSION, JSON.stringify({ userId, exp: Date.now() + SESSION_MS }));

/** the signed-in user (fresh from the db) or null — used by every other api module for authorization */
export function sessionUser() {
  const s = readSession();
  const u = s && db().users.find(x => x.id === s.userId);
  return u && u.status === 'active' ? u : null;
}
export const requireUser = () => { const u = sessionUser(); if (!u) throw new ApiError(t('Please sign in to continue.'), 401); return u; };
export const requireAdmin = () => { const u = requireUser(); if (u.role !== 'admin') throw new ApiError(t('Admins only.'), 403); return u; };

export async function fetchMe() { await sleep(60); return publicUser(sessionUser()); }

/* ---------- validation ---------- */
const emailOk = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
export function passwordIssues(pw) {
  const out = [];
  if (pw.length < 8) out.push(t('at least 8 characters'));
  if (!/[A-Z]/.test(pw)) out.push(t('one uppercase letter'));
  if (!/[a-z]/.test(pw)) out.push(t('one lowercase letter'));
  if (!/\d/.test(pw)) out.push(t('one number'));
  return out;
}

/* ---------- auth ---------- */
export async function register({ name, email, password, phone = '' }) {
  await sleep(380);
  name = String(name || '').trim(); email = String(email || '').trim().toLowerCase();
  if (name.length < 2) throw new ApiError(t('Please enter your name.'), 422, 'name');
  if (!emailOk(email)) throw new ApiError(t('Enter a valid email address.'), 422, 'email');
  const issues = passwordIssues(password || '');
  if (issues.length) throw new ApiError(t('Password needs {list}.', { list: issues.join(', ') }), 422, 'password');
  if (db().users.some(u => u.email === email)) throw new ApiError(t('An account with this email already exists.'), 409, 'email');
  const salt = randomId(12);
  const user = { id: 'u_' + randomId(8), name, email, role: 'customer', phone, status: 'active', salt, pw: await hashPassword(password, salt), addresses: [], wishlist: [], createdAt: Date.now() };
  db().users.push(user);
  persist();
  startSession(user.id);
  return publicUser(user);
}

export async function login({ email, password }) {
  await sleep(380);
  email = String(email || '').trim().toLowerCase();
  const a = attempts.get(email);
  if (a && a.until > Date.now()) throw new ApiError(t('Too many attempts. Try again in {s}s.', { s: Math.ceil((a.until - Date.now()) / 1000) }), 429);
  const user = db().users.find(u => u.email === email);
  const ok = user && (await hashPassword(password || '', user.salt)) === user.pw;
  if (!ok) {
    const n = (a?.n || 0) + 1;
    attempts.set(email, { n, until: n >= 5 ? Date.now() + 60000 : 0 });
    throw new ApiError(t('Incorrect email or password.'), 401);
  }
  if (user.status !== 'active') throw new ApiError(t('This account has been disabled. Contact support.'), 403);
  attempts.delete(email);
  startSession(user.id);
  return publicUser(user);
}

export function logout() { localStorage.removeItem(SESSION); }

export async function requestPasswordReset(email) {
  await sleep(500);
  if (!emailOk(String(email || '').trim())) throw new ApiError(t('Enter a valid email address.'), 422, 'email');
  return true;   // always succeeds so accounts can't be enumerated
}

/* ---------- profile ---------- */
export async function updateProfile(patch) {
  await sleep(250);
  const u = requireUser();
  const name = String(patch.name ?? u.name).trim();
  if (name.length < 2) throw new ApiError(t('Please enter your name.'), 422, 'name');
  u.name = name; u.phone = String(patch.phone ?? u.phone).trim();
  persist();
  return publicUser(u);
}

export async function changePassword({ current, next }) {
  await sleep(380);
  const u = requireUser();
  if ((await hashPassword(current || '', u.salt)) !== u.pw) throw new ApiError(t('Current password is incorrect.'), 422, 'current');
  const issues = passwordIssues(next || '');
  if (issues.length) throw new ApiError(t('New password needs {list}.', { list: issues.join(', ') }), 422, 'next');
  u.salt = randomId(12); u.pw = await hashPassword(next, u.salt);
  persist();
  return true;
}

export async function saveAddress(addr) {
  await sleep(200);
  const u = requireUser();
  const req = ['name', 'phone', 'line1', 'city', 'province'];
  for (const k of req) if (!String(addr[k] || '').trim()) throw new ApiError(t('Please fill in all required fields.'), 422, k);
  if (!/^[0-9+\s-]{8,15}$/.test(addr.phone)) throw new ApiError(t('Enter a valid phone number.'), 422, 'phone');
  const clean = { id: addr.id || 'a_' + randomId(6), label: addr.label || 'Home', name: addr.name.trim(), phone: addr.phone.trim(), line1: addr.line1.trim(), city: addr.city.trim(), province: addr.province.trim(), zip: (addr.zip || '').trim(), country: addr.country || 'Vietnam', isDefault: !!addr.isDefault };
  if (clean.isDefault || !u.addresses.length) { u.addresses.forEach(a => { a.isDefault = false; }); clean.isDefault = true; }
  const i = u.addresses.findIndex(a => a.id === clean.id);
  if (i >= 0) u.addresses[i] = clean; else u.addresses.push(clean);
  persist();
  return publicUser(u);
}

export async function deleteAddress(id) {
  await sleep(150);
  const u = requireUser();
  u.addresses = u.addresses.filter(a => a.id !== id);
  if (u.addresses.length && !u.addresses.some(a => a.isDefault)) u.addresses[0].isDefault = true;
  persist();
  return publicUser(u);
}

export async function toggleWishlist(productId) {
  const u = requireUser();
  u.wishlist = u.wishlist.includes(productId) ? u.wishlist.filter(x => x !== productId) : [...u.wishlist, productId];
  persist();
  return publicUser(u);
}

/* ---------- admin: customers ---------- */
export async function listCustomers() {
  await sleep(180);
  requireAdmin();
  const { users, orders } = db();
  return users.filter(u => u.role === 'customer').map(u => {
    const mine = orders.filter(o => o.userId === u.id && !['cancelled', 'returned'].includes(o.status));
    return { ...publicUser(u), orderCount: mine.length, spent: mine.reduce((a, o) => a + o.total, 0) };
  });
}

export async function setCustomerStatus(id, status) {
  await sleep(150);
  requireAdmin();
  const u = db().users.find(x => x.id === id);
  if (!u) throw new ApiError(t('Customer not found.'), 404);
  if (u.role === 'admin') throw new ApiError(t('Admin accounts cannot be disabled here.'), 403);
  u.status = status === 'disabled' ? 'disabled' : 'active';
  persist();
  return publicUser(u);
}
