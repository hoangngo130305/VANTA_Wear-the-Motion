import { BASE } from '../lib/utils.js';
export { GARMENT_SIZES, SHOE_SIZES, AUDIENCES } from '../api/products.js';

/** Product records live in the (mock) database — see api/seed.js. This file holds image helpers and editorial content. */
export const asset = p => (!p ? '' : /^(data:|https?:|blob:)/.test(p) ? p : BASE + p.replace(/^\.?\//, ''));
export const gImg = (g, v = 'front') => asset(g.views?.[v] || g.img);
export const sImg = s => asset(s.img);
export const thumb = p => asset(p.img);
export const mImg = name => `${BASE}img/m/${name}.webp`;
export const cImg = name => `${BASE}img/c/${name}.webp`;
export const cartItemOf = p => ({ id: p.id, name: p.name, price: p.price, img: thumb(p) });
export const sizeLabel = (p, size) => (p.kind === 's' ? 'EU ' + size : size);
export const sizeKey = label => String(label).replace(/^EU\s*/, '');

export const SIZE_GUIDE = {
  garments: { head: ['Size', 'Chest (cm)', 'Length (cm)', 'Shoulder (cm)'], rows: [['S', '110', '68', '50'], ['M', '116', '70', '52'], ['L', '122', '72', '54'], ['XL', '128', '74', '56']] },
  shoes: { head: ['EU', 'US (M)', 'UK', 'Foot length (cm)'], rows: [['40', '7', '6', '25.0'], ['41', '8', '7', '25.7'], ['42', '8.5', '7.5', '26.3'], ['43', '9.5', '8.5', '27.0'], ['44', '10', '9', '27.7'], ['45', '11', '10', '28.3'], ['46', '12', '11', '29.0']] }
};
