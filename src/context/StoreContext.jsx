import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartItemOf, sizeKey, sizeLabel } from '../data/catalog.js';
import { useCatalog } from './CatalogContext.jsx';
import { evaluateCoupon } from '../api/coupons.js';
import { pName } from '../i18n/helpers.js';
import { shippingFee } from '../api/orders.js';
import { readSettings } from '../api/settings.js';
import { t } from '../i18n/index.js';

const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

const KEY = 'vanta-cart-v2', COUPON_KEY = 'vanta-coupon';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

export function StoreProvider({ children }) {
  const { byId, version } = useCatalog();

  /* ---- cart (a guest's bag lives in this browser; it survives sign-in) ---- */
  const [items, setItems] = useState(() => read(KEY, []));
  useEffect(() => write(KEY, items), [items]);
  const [bump, setBump] = useState(0);
  const [couponCode, setCouponCode] = useState(() => read(COUPON_KEY, ''));
  useEffect(() => write(COUPON_KEY, couponCode), [couponCode]);

  /* lines enriched with live product data (price, stock, availability) */
  const lines = useMemo(() => items.map(it => {
    const p = byId[it.id];
    const max = p ? (p.stock[sizeKey(it.size)] || 0) : 0;
    return { ...it, product: p, price: p ? p.price : it.price, img: p ? it.img : it.img, max, unavailable: !p || max <= 0, overStock: !!p && it.qty > max };
  }), [items, byId, version]);       // eslint-disable-line react-hooks/exhaustive-deps

  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const settings = readSettings();
  const freeFrom = settings.freeShippingFrom;
  const hasIssues = lines.some(l => l.unavailable || l.overStock);

  const couponState = useMemo(() => {
    if (!couponCode) return { coupon: null, error: '' };
    try { return { coupon: evaluateCoupon(couponCode, subtotal), error: '' }; }
    catch (e) { return { coupon: null, error: e.message }; }
  }, [couponCode, subtotal, version]);   // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useCallback((method = 'standard') => {
    const coupon = couponState.coupon;
    const discount = coupon?.discount || 0;
    const shipping = items.length ? shippingFee(subtotal - discount, method, coupon) : 0;
    return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount) + shipping, coupon };
  }, [couponState, subtotal, items.length]);

  /* ---- overlays ---- */
  const [cartOpen, setCartOpen] = useState(false);
  const [qv, setQv] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const anyOverlay = cartOpen || !!qv || searchOpen || menuOpen;
  const overlayRef = useRef(false);
  overlayRef.current = cartOpen || !!qv || searchOpen;

  useEffect(() => {
    document.body.style.overflow = anyOverlay ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyOverlay]);

  /* ---- toast ---- */
  const [toast, setToast] = useState({ show: false, content: null, id: 0 });
  const toastTimer = useRef(0);
  const showToast = useCallback((content, ms = 3200) => {
    setToast(t => ({ show: true, content, id: t.id + 1 }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), ms);
  }, []);
  const hideToast = useCallback(() => setToast(t => ({ ...t, show: false })), []);
  const toastError = useCallback(msg => showToast(<><span className="tick tick--err">!</span><span>{msg}</span></>, 4200), [showToast]);

  const openCart = useCallback(() => { setCartOpen(true); hideToast(); }, [hideToast]);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openQV = useCallback(p => setQv(p), []);
  const closeQV = useCallback(() => setQv(null), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  /* ---- cart actions ---- */
  const addToCart = useCallback((product, size, qty = 1, { quiet = false } = {}) => {
    const label = sizeLabel(product, size);
    const have = items.find(i => i.id === product.id && i.size === label)?.qty || 0;
    const stock = product.stock?.[size] ?? 0;
    if (stock <= 0) { toastError(t('{name} ({size}) is sold out.', { name: pName(product), size: label })); return false; }
    if (have + qty > stock) { toastError(have ? t('Only {n} left in {size} — you already have {have} in your bag.', { n: stock, size: label, have }) : t('Only {n} left in {size}.', { n: stock, size: label })); return false; }
    setItems(prev => {
      const key = product.id + '|' + label;
      const ex = prev.find(i => i.key === key);
      if (ex) return prev.map(i => (i === ex ? { ...i, qty: i.qty + qty } : i));
      const base = cartItemOf(product);
      return [...prev, { key, id: base.id, name: base.name, price: base.price, img: base.img, size: label, qty }];
    });
    setBump(b => b + 1);
    if (!quiet) {
      showToast(<>
        <img src={cartItemOf(product).img} alt="" />
        <span>{t('{name} · {size} added', { name: pName(product), size: label })}</span>
        <button type="button" onClick={openCart}>{t("View bag")}</button>
      </>);
    }
    return true;
  }, [items, showToast, toastError, openCart]);

  const changeQty = useCallback((key, d) => {
    setItems(prev => prev.map(i => {
      if (i.key !== key) return i;
      const p = byId[i.id], max = p ? (p.stock[sizeKey(i.size)] || 0) : 0;
      return { ...i, qty: Math.max(0, Math.min(i.qty + d, d > 0 ? Math.max(max, i.qty) : i.qty)) };
    }).filter(i => i.qty > 0));
  }, [byId]);
  const removeItem = useCallback(key => setItems(prev => prev.filter(i => i.key !== key)), []);
  const clearCart = useCallback(() => { setItems([]); setCouponCode(''); }, []);

  /* ---- global keys ---- */
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { setQv(null); setCartOpen(false); setSearchOpen(false); setMenuOpen(false); }
      if (e.key === '/' && !e.target.matches?.('input,textarea,select')) { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({
    items, lines, count, subtotal, bump, hasIssues, freeFrom, totals,
    couponCode, setCouponCode, coupon: couponState.coupon, couponError: couponState.error,
    addToCart, changeQty, removeItem, clearCart,
    cartOpen, openCart, closeCart, qv, openQV, closeQV, searchOpen, openSearch, closeSearch, menuOpen, setMenuOpen,
    toast, showToast, hideToast, toastError, anyOverlay, overlayRef
  }), [items, lines, count, subtotal, bump, hasIssues, freeFrom, totals, couponCode, couponState, addToCart, changeQty, removeItem, clearCart,
    cartOpen, openCart, closeCart, qv, openQV, closeQV, searchOpen, openSearch, closeSearch, menuOpen, toast, showToast, hideToast, toastError, anyOverlay]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
