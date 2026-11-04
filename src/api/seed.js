import { hashPassword } from './crypto.js';

/* deterministic PRNG so the demo data is identical on every fresh install */
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}


export const PRODUCT_VI = {
  ember:  { name: 'Áo thun Ember', color: 'Đất nung', desc: 'Áo thun cotton dày 240gsm màu đất nung cháy với biểu tượng ở ngực. Form boxy, cổ bo gân.' },
  sage:   { name: 'Áo nỉ cổ tròn Sage', color: 'Xanh sage', desc: 'Áo nỉ cổ tròn lót lông mềm màu xanh sage dịu. Bo tay và gấu gân, form oversize thoải mái.' },
  solar:  { name: 'Áo hoodie Solar', color: 'Vàng mù tạt', desc: 'Áo hoodie vàng mù tạt ấm áp với túi kangaroo, dây rút và họa tiết mặt trời ở ngực.' },
  cloud:  { name: 'Áo bomber Cloud', color: 'Trắng ngà', desc: 'Áo bomber nhẹ màu trắng ngà, viền bo xanh navy, khóa kéo toàn thân và túi viền.' },
  slate:  { name: 'Áo khoác dáng dài Slate', color: 'Xám đá phiến', desc: 'Áo khoác dáng dài hai hàng khuy, chất liệu len pha, ve áo bản rộng và độ rủ gọn gàng.' },
  tide:   { name: 'Áo hoodie khóa kéo Tide', color: 'Xanh denim', desc: 'Áo hoodie khóa kéo màu xanh denim với họa tiết sóng ở ngực. Chất nỉ dày dặn.' },
  royal:  { desc: 'Mẫu cao cổ huyền thoại phối da xanh hoàng gia và đen. Cổ giày đệm êm, phom dáng di sản.' },
  heat:   { desc: 'Da màu kem, da lộn nâu cacao và điểm nhấn đỏ tín hiệu. Đệm khí lộ thiên ở đế giày.' },
  panda:  { desc: 'Đôi sneaker court trắng đen kinh điển. Thân da, đế cupsole, đơn giản mà chuẩn.' },
  terra:  { desc: 'Giày chạy phong cách địa hình, dáng chunky với tông màu đất và dây đai phủ ngoài.' },
  drift:  { desc: 'Giày chạy dáng thấp màu xám khói với điểm nhấn hồng nhung. Đế bọt êm ái.' },
  court:  { desc: 'Giày court tối giản bằng da đen trên đế màu kem.' },
  void:   { desc: 'Giày thể thao đen tuyền cho những chuyến đi đêm. Chi tiết ốp tạo hình, đế cao nhiều lớp.' }
};

const G_SIZES = ['S', 'M', 'L', 'XL'];
const S_SIZES = ['40', '41', '42', '43', '44', '45', '46'];
const stockFor = (sizes, rnd, base = 18) => Object.fromEntries(sizes.map(s => [s, Math.floor(rnd() * base)]));

const garment = (id, name, category, price, rs, rf, color, desc, extra = {}) => ({
  id, kind: 'g', category, name, price, compareAt: null, color, desc, img: `img/g/${id}-front.svg`,
  views: { front: `img/g/${id}-front.svg`, side: `img/g/${id}-side.svg`, back: `img/g/${id}-back.svg` },
  rs, rf, sizes: G_SIZES, tags: [], featured: false, active: true, ...extra
});
const sneaker = (id, file, name, price, tint, desc, extra = {}) => ({
  id, kind: 's', category: 'Sneakers', name, price, compareAt: null, color: 'Sneakers', desc, img: `img/s/${file}.webp`,
  views: null, tint, sizes: S_SIZES, tags: [], featured: false, active: true, ...extra
});

/** product categories (managed in Admin → Categories). kind decides the size set: g = apparel sizes, s = EU shoe sizes */
export const CAT_ID = { 'Tees': 'tees', 'Hoodies & Sweats': 'hoodies', 'Outerwear': 'outerwear', 'Sneakers': 'sneakers' };
export const seedCategories = () => [
  { id: 'sneakers', kind: 's', order: 1, active: true, name: { en: 'Sneakers', vi: 'Sneaker' } },
  { id: 'tees', kind: 'g', order: 2, active: true, name: { en: 'Tees', vi: 'Áo thun' } },
  { id: 'hoodies', kind: 'g', order: 3, active: true, name: { en: 'Hoodies & Sweats', vi: 'Hoodie & Nỉ' } },
  { id: 'outerwear', kind: 'g', order: 4, active: true, name: { en: 'Outerwear', vi: 'Áo khoác' } }
];
/** who a product is styled for: men | women | unisex */
export const AUDIENCE = { ember: 'unisex', sage: 'women', solar: 'unisex', cloud: 'unisex', slate: 'men', tide: 'men', royal: 'men', heat: 'men', panda: 'unisex', terra: 'unisex', drift: 'women', court: 'unisex', void: 'men' };

export function seedProducts() {
  const rnd = mulberry32(7);
  const list = [
    garment('ember', 'Ember Tee', 'Tees', 49, .3, .714, 'Terracotta', 'Heavy 240gsm cotton tee in burnt terracotta with a chest emblem. Boxy cut, ribbed collar.', { tags: ['new'], featured: true }),
    garment('sage', 'Sage Crewneck', 'Hoodies & Sweats', 69, .3, .714, 'Sage green', 'Brushed-back fleece crewneck in a soft sage. Ribbed cuffs and hem, relaxed oversized fit.'),
    garment('solar', 'Solar Hoodie', 'Hoodies & Sweats', 85, .3, .714, 'Mustard', 'Warm mustard hoodie with a kangaroo pocket, drawcords and a sun graphic on the chest.', { tags: ['bestseller'], featured: true }),
    garment('cloud', 'Cloud Bomber', 'Outerwear', 129, .3, .714, 'Off-white', 'Lightweight bomber in off-white with navy rib trims, a full zip and welt pockets.', { compareAt: 159 }),
    garment('slate', 'Slate Overcoat', 'Outerwear', 169, .3, .714, 'Slate grey', 'Double-breasted wool-blend overcoat with wide lapels and a long, clean drape.', { tags: ['new'] }),
    garment('tide', 'Tide Zip Hoodie', 'Hoodies & Sweats', 89, .3, .714, 'Denim blue', 'Full-zip hoodie in denim blue with a wave print on the chest. Heavyweight fleece.', { featured: true }),
    sneaker('royal', 'shoe-7', 'Royal Hi', 169, '#dbe0f2', 'High-top icon in royal blue and black leather. Padded collar, heritage shape.', { tags: ['bestseller'], featured: true }),
    sneaker('heat', 'shoe-1', 'Heat Index', 179, '#f2ded8', 'Cream leather, cocoa suede and a hit of signal red. Visible air unit underfoot.', { tags: ['new'] }),
    sneaker('panda', 'shoe-4', 'Panda Low', 129, '#e0e6da', 'The clean black-and-white court classic. Leather upper, cupsole, no fuss.', { featured: true }),
    sneaker('terra', 'shoe-2', 'Terra Trail', 169, '#e8dfd2', 'Chunky trail-inspired runner in earth tones with a strap overlay.'),
    sneaker('drift', 'shoe-3', 'Drift 01', 149, '#e8e2dc', 'Low-profile runner in smoke grey with a velvet-pink pop. Plush foam midsole.'),
    sneaker('court', 'shoe-5', 'Court Classic', 139, '#dfe3e6', 'Stripped-back court shoe in black leather on a cream sole.'),
    sneaker('void', 'shoe-6', 'Void Runner', 159, '#dcdcdc', 'All-black stealth trainer built for night rides. Sculpted overlays, stacked sole.', { compareAt: 189 })
  ];
  const now = Date.now();
  return list.map((p, i) => {
    const stock = stockFor(p.sizes, rnd);
    if (p.id === 'slate') { Object.keys(stock).forEach(k => { stock[k] = k === 'M' ? 2 : 0; }); }   // low stock demo
    if (p.id === 'terra') { Object.keys(stock).forEach(k => { stock[k] = 0; }); }                    // sold-out demo
    const vi = PRODUCT_VI[p.id];
    return { ...p, category: CAT_ID[p.category] || p.category, audience: AUDIENCE[p.id] || 'unisex', stock, i18n: vi ? { vi } : {}, createdAt: now - (list.length - i) * 86400000 * 3 };
  });
}

const FIRST = ['Linh', 'Minh', 'Hoang', 'Mai', 'Khanh', 'An', 'Trang', 'Duc', 'Phuong', 'Nam'];
const LAST = ['Nguyen', 'Tran', 'Le', 'Pham', 'Vo', 'Dang', 'Bui', 'Do'];
const CITIES = [['Ho Chi Minh City', 'Ho Chi Minh'], ['Ha Noi', 'Ha Noi'], ['Da Nang', 'Da Nang'], ['Can Tho', 'Can Tho'], ['Hai Phong', 'Hai Phong']];
const REVIEW_TEXT = [
  ['Exactly what I wanted', 'Fit is perfect and the fabric feels premium. Shipping was quick too.'],
  ['Great quality', 'Heavy fabric, clean stitching. Looks even better in person.'],
  ['Love it', 'Wearing it almost every day. Sizing is true — I went with my usual.'],
  ['Solid but runs big', 'Great piece, just size down if you like a regular fit.'],
  ['Worth the price', 'Feels way more expensive than it is. Will buy again.']
];

export async function buildSeed() {
  const rnd = mulberry32(42);
  const products = seedProducts();
  const now = Date.now();
  const pick = arr => arr[Math.floor(rnd() * arr.length)];

  /* users */
  const mk = async (id, name, email, role, pw, createdAgo) => {
    const salt = id + 'salt';
    return { id, name, email, role, phone: '', status: 'active', salt, pw: await hashPassword(pw, salt), addresses: [], wishlist: [], createdAt: now - createdAgo * 86400000 };
  };
  const users = [
    await mk('u_admin', 'Store Admin', 'admin@vanta.com', 'admin', 'Admin@123', 90),
    await mk('u_demo', 'Demo Customer', 'demo@vanta.com', 'customer', 'Demo@123', 40)
  ];
  users[1].phone = '0901234567';
  users[1].addresses = [{ id: 'a1', label: 'Home', name: 'Demo Customer', phone: '0901234567', line1: '12 Nguyen Hue', city: 'Ho Chi Minh City', province: 'Ho Chi Minh', zip: '700000', country: 'Vietnam', isDefault: true }];
  users[1].wishlist = ['royal', 'solar'];
  for (let i = 0; i < 8; i++) {
    const name = `${pick(LAST)} ${pick(FIRST)}`;
    users.push(await mk('u_c' + i, name, `customer${i + 1}@example.com`, 'customer', 'Customer@123', Math.floor(rnd() * 60) + 3));
  }

  /* reviews */
  const reviews = [];
  products.forEach(p => {
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const u = users[2 + Math.floor(rnd() * 8)], [title, body] = pick(REVIEW_TEXT);
      reviews.push({ id: `r_${p.id}_${i}`, productId: p.id, userId: u.id, userName: u.name, rating: 3 + Math.round(rnd() * 2), title, body, verified: true, createdAt: now - Math.floor(rnd() * 40) * 86400000 });
    }
  });

  /* orders: ~34 across the last 30 days so the dashboard has something to show */
  const orders = [];
  const methods = ['card', 'cod', 'momo', 'vnpay', 'bank', 'paypal'];
  for (let i = 0; i < 34; i++) {
    const u = users[2 + Math.floor(rnd() * 8)];
    const daysAgo = Math.floor(rnd() * 30), at = now - daysAgo * 86400000 - Math.floor(rnd() * 80000000);
    const lines = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => {
      const p = pick(products), size = pick(p.sizes);
      return { productId: p.id, name: p.name, img: p.img, price: p.price, size: p.kind === 's' ? 'EU ' + size : size, qty: 1 + Math.floor(rnd() * 2) };
    });
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const method = pick(methods), express = rnd() > .75;
    const fee = subtotal >= 150 ? 0 : express ? 15 : 5;
    const [city, province] = pick(CITIES);
    const r = rnd();
    const status = daysAgo > 12 ? (r > .9 ? 'cancelled' : r > .85 ? 'returned' : 'delivered') : daysAgo > 5 ? (r > .5 ? 'delivered' : 'shipped') : daysAgo > 1 ? pick(['processing', 'shipped', 'processing']) : 'pending';
    const paid = status !== 'cancelled' && !['cod', 'bank'].includes(method) || status === 'delivered';
    const timeline = [{ status: 'pending', at, note: 'Order placed' }];
    const order = ['processing', 'shipped', 'delivered'];
    if (status === 'cancelled') timeline.push({ status: 'cancelled', at: at + 3600000, note: 'Cancelled' });
    else if (status === 'returned') timeline.push({ status: 'processing', at: at + 3600000 }, { status: 'shipped', at: at + 86400000 }, { status: 'delivered', at: at + 3 * 86400000 }, { status: 'returned', at: at + 6 * 86400000 });
    else order.slice(0, order.indexOf(status) + 1).forEach((s, k) => timeline.push({ status: s, at: at + (k + 1) * 43200000 }));
    orders.push({
      id: 'VT-' + (10001 + i), userId: u.id, email: u.email, items: lines,
      shipping: { name: u.name, phone: '09' + Math.floor(10000000 + rnd() * 89999999), line1: `${1 + Math.floor(rnd() * 200)} Le Loi`, city, province, zip: '700000', country: 'Vietnam', method: express ? 'express' : 'standard', fee },
      payment: { method, status: status === 'cancelled' ? 'refunded' : status === 'returned' ? 'refunded' : paid ? 'paid' : 'unpaid', ref: 'demo_' + (1000 + i) },
      coupon: null, subtotal, discount: 0, shippingFee: fee, total: subtotal + fee, status, timeline, createdAt: at
    });
  }
  orders.sort((a, b) => b.createdAt - a.createdAt);

  const coupons = [
    { id: 'c1', code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 0, expiresAt: null, usageLimit: 0, used: 3, active: true, note: 'New customers' },
    { id: 'c2', code: 'SAVE15', type: 'fixed', value: 15, minSubtotal: 100, expiresAt: null, usageLimit: 0, used: 1, active: true, note: '$15 off orders $100+' },
    { id: 'c4', code: 'LOOK10', type: 'percent', value: 10, minSubtotal: 0, expiresAt: null, usageLimit: 0, used: 0, active: true, note: 'Runway bundle — full look' },
    { id: 'c3', code: 'FREESHIP', type: 'freeship', value: 0, minSubtotal: 0, expiresAt: null, usageLimit: 0, used: 0, active: true, note: 'Free standard shipping' }
  ];

  const settings = {
    storeName: 'VANTA', supportEmail: 'hello@vanta.example', freeShippingFrom: 150, vndRate: 25000,
    shipping: { standard: 5, express: 15 },
    payments: { card: true, paypal: true, momo: true, vnpay: true, bank: true, cod: true }
  };

  return { version: 4, content: {}, categories: seedCategories(), users, products, reviews, orders, coupons, settings, seq: 10001 + orders.length };
}
