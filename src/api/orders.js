import { ApiError, db, persist, sleep } from './db.js';
import { requireAdmin, requireUser } from './auth.js';
import { evaluateCoupon } from './coupons.js';
import { processPayment } from './payments.js';
import { t } from '../i18n/index.js';
import { pName } from '../i18n/helpers.js';

export const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const NEXT = { pending: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: ['returned'], cancelled: [], returned: [] };
export const nextStatuses = s => NEXT[s] || [];
const stamp = (order, status, note) => order.timeline.push({ status, at: Date.now(), note: note || '' });

export function shippingFee(subtotal, method, coupon) {
  const s = db().settings;
  if (coupon?.freeShip && method === 'standard') return 0;
  if (subtotal >= s.freeShippingFrom && method === 'standard') return 0;
  return s.shipping[method] ?? s.shipping.standard;
}

/** What the order WOULD cost — recomputed from the database, never from client-supplied prices. */
export function quote(items, { shippingMethod = 'standard', couponCode } = {}) {
  if (!Array.isArray(items) || !items.length) throw new ApiError(t('Your bag is empty.'), 422);
  const lines = items.map(it => {
    const p = db().products.find(x => x.id === it.productId && x.active);
    if (!p) throw new ApiError(t('“{name}” is no longer available.', { name: it.name || it.productId }), 409);
    const sizeKey = String(it.size).replace(/^EU\s*/, '');
    if (!p.sizes.includes(sizeKey)) throw new ApiError(t('Size {size} is not available for {name}.', { size: it.size, name: pName(p) }), 409);
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    if ((p.stock[sizeKey] || 0) < qty) throw new ApiError(t('{name} ({size}) — only {n} left.', { name: pName(p), size: it.size, n: p.stock[sizeKey] || 0 }), 409);
    return { productId: p.id, name: p.name, img: p.img, price: p.price, size: it.size, qty, sizeKey };
  });
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const coupon = couponCode ? evaluateCoupon(couponCode, subtotal) : null;
  const discount = coupon?.discount || 0;
  const fee = shippingFee(subtotal - discount, shippingMethod, coupon);
  return { lines, subtotal, coupon, discount, shippingFee: fee, total: Math.max(0, subtotal - discount) + fee };
}

export async function getQuote(items, opts) { await sleep(120); return quote(items, opts); }

export async function createOrder({ items, shipping, paymentMethod, paymentData, couponCode }) {
  const user = requireUser();                                    // guests cannot place orders
  for (const k of ['name', 'phone', 'line1', 'city', 'province']) {
    if (!String(shipping?.[k] || '').trim()) throw new ApiError(t('Please complete the shipping address.'), 422, k);
  }
  if (!/^[0-9+\s-]{8,15}$/.test(shipping.phone)) throw new ApiError(t('Enter a valid phone number.'), 422, 'phone');
  const method = shipping.method === 'express' ? 'express' : 'standard';
  const q = quote(items, { shippingMethod: method, couponCode });

  const pay = await processPayment(paymentMethod, paymentData, q.total);   // throws on decline → nothing below runs

  // re-check stock right before committing (another tab may have bought the last one)
  q.lines.forEach(l => {
    const p = db().products.find(x => x.id === l.productId);
    if ((p.stock[l.sizeKey] || 0) < l.qty) throw new ApiError(t('{name} ({size}) just sold out.', { name: pName(p), size: l.size }), 409);
  });
  q.lines.forEach(l => { db().products.find(x => x.id === l.productId).stock[l.sizeKey] -= l.qty; });
  if (q.coupon) { const c = db().coupons.find(x => x.code === q.coupon.code); if (c) c.used += 1; }

  const id = 'VT-' + db().seq++;
  const now = Date.now();
  const paid = pay.status === 'paid';
  const order = {
    id, userId: user.id, email: user.email,
    items: q.lines.map(({ sizeKey, ...l }) => l),
    shipping: { name: shipping.name.trim(), phone: shipping.phone.trim(), line1: shipping.line1.trim(), city: shipping.city.trim(), province: shipping.province.trim(), zip: (shipping.zip || '').trim(), country: shipping.country || 'Vietnam', method, fee: q.shippingFee },
    payment: { method: paymentMethod, status: paid ? 'paid' : 'unpaid', ref: pay.ref, detail: pay.detail },
    coupon: q.coupon ? { code: q.coupon.code, discount: q.discount } : null,
    subtotal: q.subtotal, discount: q.discount, shippingFee: q.shippingFee, total: q.total,
    status: paid ? 'processing' : 'pending',
    timeline: [{ status: 'pending', at: now, note: 'Order placed' }],
    createdAt: now
  };
  if (paid) order.timeline.push({ status: 'processing', at: now + 1, note: 'Payment received', detail: pay.detail });
  db().orders.unshift(order);
  persist();
  return order;
}

/* ---------- reads (authorized) ---------- */
export async function listMyOrders() { await sleep(200); const u = requireUser(); return db().orders.filter(o => o.userId === u.id); }

export async function getOrder(id) {
  await sleep(150);
  const u = requireUser();
  const o = db().orders.find(x => x.id === id);
  if (!o) throw new ApiError(t('Order not found.'), 404);
  if (o.userId !== u.id && u.role !== 'admin') throw new ApiError(t('You do not have access to this order.'), 403);
  return o;
}

export async function listAllOrders() { await sleep(200); requireAdmin(); return db().orders.map(o => ({ ...o, customerName: db().users.find(u => u.id === o.userId)?.name || o.shipping.name })); }

/* ---------- writes ---------- */
function restock(order) {
  order.items.forEach(l => {
    const p = db().products.find(x => x.id === l.productId);
    if (p) { const k = String(l.size).replace(/^EU\s*/, ''); p.stock[k] = (p.stock[k] || 0) + l.qty; }
  });
}

export async function cancelOrder(id) {
  await sleep(300);
  const u = requireUser();
  const o = db().orders.find(x => x.id === id);
  if (!o) throw new ApiError(t('Order not found.'), 404);
  if (o.userId !== u.id && u.role !== 'admin') throw new ApiError(t('You do not have access to this order.'), 403);
  if (!['pending', 'processing'].includes(o.status)) throw new ApiError(t('This order has already shipped and can no longer be cancelled.'), 409);
  o.status = 'cancelled';
  if (o.payment.status === 'paid') o.payment.status = 'refunded';
  restock(o);
  stamp(o, 'cancelled', u.role === 'admin' ? 'Cancelled by store' : 'Cancelled by customer');
  persist();
  return o;
}

export async function updateOrderStatus(id, status, note) {
  await sleep(250);
  requireAdmin();
  const o = db().orders.find(x => x.id === id);
  if (!o) throw new ApiError(t('Order not found.'), 404);
  if (!nextStatuses(o.status).includes(status)) throw new ApiError(t('Cannot move a {from} order to {to}.', { from: t(o.status), to: t(status) }), 409);
  if (status === 'cancelled') { if (o.payment.status === 'paid') o.payment.status = 'refunded'; restock(o); }
  if (status === 'returned') { o.payment.status = 'refunded'; restock(o); }
  if (status === 'delivered' && o.payment.method === 'cod') o.payment.status = 'paid';
  o.status = status;
  stamp(o, status, note);
  persist();
  return o;
}

export async function markOrderPaid(id) {
  await sleep(200);
  requireAdmin();
  const o = db().orders.find(x => x.id === id);
  if (!o) throw new ApiError(t('Order not found.'), 404);
  if (o.payment.status === 'paid') return o;
  o.payment.status = 'paid';
  stamp(o, o.status, 'Payment confirmed by store');
  if (o.status === 'pending') { o.status = 'processing'; stamp(o, 'processing', 'Payment confirmed'); }
  persist();
  return o;
}
