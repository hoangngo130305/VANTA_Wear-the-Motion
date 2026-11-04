import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createOrder } from '../api/orders.js';
import { saveAddress } from '../api/auth.js';
import { PAYMENT_METHODS, cardBrand, validateCard } from '../api/payments.js';
import { readSettings } from '../api/settings.js';
import { previewCoupon } from '../api/coupons.js';
import { money } from '../lib/utils.js';
import { Breadcrumbs, Field } from '../components/ui/index.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import PaySim from '../components/PaySim.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { t, tc, rich } from '../i18n/index.js';

const EMPTY = { name: '', phone: '', line1: '', city: '', province: '', zip: '', country: 'Vietnam' };
const fmtCard = v => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = v => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; };

export default function Checkout() {
  const { user } = useAuth();
  const { items, lines, count, hasIssues, totals, couponCode, setCouponCode, couponError, clearCart, toastError } = useStore();
  const navigate = useNavigate();
  const settings = readSettings();
  const { content } = useCatalog();
  const { brand } = content;
  const methods = PAYMENT_METHODS.filter(m => settings.payments[m.id]);

  const saved = user.addresses;
  const def = saved.find(a => a.isDefault) || saved[0];
  const [addrId, setAddrId] = useState(def?.id || 'new');
  const [form, setForm] = useState({ ...EMPTY, name: user.name, phone: user.phone || '' });
  const [saveIt, setSaveIt] = useState(true);
  const [ship, setShip] = useState('standard');
  const [pay, setPay] = useState(methods[0]?.id || 'cod');
  const [card, setCard] = useState({ number: '', name: user.name, expiry: '', cvc: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);
  const [sim, setSim] = useState(false);
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState('');

  const tt = totals(ship);
  const address = addrId === 'new' ? form : saved.find(a => a.id === addrId) || form;

  useEffect(() => { document.title = t('Checkout') + ' — ' + brand.name; return () => { document.title = tc(content.seo.title).replace('{brand}', brand.name); }; }, []);

  const shipOptions = useMemo(() => [
    { id: 'standard', label: t('Standard'), eta: t('2–4 working days'), fee: totals('standard').shipping },
    { id: 'express', label: t('Express'), eta: t('Next day (HCMC & Ha Noi)'), fee: totals('express').shipping }
  ], [totals]);

  if (count === 0 && !busy) return <Navigate to="/cart" replace />;

  const validateShipping = () => {
    const e = {};
    for (const k of ['name', 'phone', 'line1', 'city', 'province']) if (!String(address[k] || '').trim()) e[k] = 'Required';
    if (!e.phone && !/^[0-9+\s-]{8,15}$/.test(address.phone)) e.phone = t('Enter a valid phone number');
    return e;
  };

  const place = async (extra = {}) => {
    setBusy(true); setBanner('');
    try {
      const order = await createOrder({
        items: items.map(l => ({ productId: l.id, size: l.size, qty: l.qty, name: l.name })),
        shipping: { ...address, method: ship },
        paymentMethod: pay,
        paymentData: pay === 'card' ? card : extra,
        couponCode: couponCode || undefined
      });
      if (addrId === 'new' && saveIt) { try { await saveAddress({ ...form, label: 'Home', isDefault: !saved.length }); } catch { /* non-fatal */ } }
      clearCart();
      navigate(`/account/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setBusy(false); setSim(false);
      setBanner(err.message);
      if (err.status === 409) toastError(err.message);
    }
  };

  const submit = async e => {
    e.preventDefault();
    const errs = validateShipping();
    if (pay === 'card') {
      const c = validateCard(card);
      Object.entries(c).forEach(([k, v]) => { errs['card.' + k] = v; });
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      setBanner(t('Please fix the highlighted fields.'));
      document.querySelector('.has-error input, .has-error select')?.focus();
      return;
    }
    if (['paypal', 'momo', 'vnpay'].includes(pay)) { setSim(true); return; }
    place();
  };

  const applyCode = async e => {
    e.preventDefault(); setCodeMsg('');
    try { const c = await previewCoupon(code, tt.subtotal); setCouponCode(c.code); setCode(''); } catch (err) { setCodeMsg(err.message); }
  };

  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }), error: errors[k] });
  const cf = k => ({ value: card[k], error: errors['card.' + k] });

  return (
    <main className="page">
      <div className="wrap">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Bag', to: '/cart' }, { label: 'Checkout' }]} />
        <h1 className="h2 page__title">{rich(t('Check*out.*'))}</h1>

        <form className="checkout" onSubmit={submit} noValidate>
          <div className="checkout__main">
            {banner && <p className="form-error form-error--box" role="alert">{banner}</p>}

            <section className="step">
              <h2><span>1</span> {t('Shipping address')}</h2>
              {saved.length > 0 && (
                <div className="choices">
                  {saved.map(a => (
                    <label key={a.id} className={'choice' + (addrId === a.id ? ' on' : '')}>
                      <input type="radio" name="addr" checked={addrId === a.id} onChange={() => setAddrId(a.id)} />
                      <div><b>{a.label} {a.isDefault && <em>{t('Default')}</em>}</b><p>{a.name} · {a.phone}</p><p>{a.line1}, {a.city}, {a.province}</p></div>
                    </label>
                  ))}
                  <label className={'choice' + (addrId === 'new' ? ' on' : '')}>
                    <input type="radio" name="addr" checked={addrId === 'new'} onChange={() => setAddrId('new')} />
                    <div><b>{t("Use a new address")}</b></div>
                  </label>
                </div>
              )}
              {addrId === 'new' && (
                <div className="fields">
                  <Field label={t("Full name")} autoComplete="name" {...f('name')} />
                  <Field label={t("Phone")} type="tel" autoComplete="tel" {...f('phone')} />
                  <Field label={t("Address")} className="span2" autoComplete="address-line1" {...f('line1')} />
                  <Field label={t("City / District")} autoComplete="address-level2" {...f('city')} />
                  <Field label={t("Province")} autoComplete="address-level1" {...f('province')} />
                  <Field label={t("Postal code (optional)")} autoComplete="postal-code" {...f('zip')} />
                  <Field label={t("Country")} as="select" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
                    {['Vietnam', 'Singapore', 'Thailand', 'Japan', 'United States'].map(c => <option key={c} value={c}>{t(c)}</option>)}
                  </Field>
                  <label className="check span2"><input type="checkbox" checked={saveIt} onChange={e => setSaveIt(e.target.checked)} />{' '}{t("Save this address to my account")}</label>
                </div>
              )}
              <h3 className="step__sub">{t("Delivery")}</h3>
              <div className="choices">
                {shipOptions.map(o => (
                  <label key={o.id} className={'choice choice--row' + (ship === o.id ? ' on' : '')}>
                    <input type="radio" name="ship" checked={ship === o.id} onChange={() => setShip(o.id)} />
                    <div><b>{o.label}</b><p>{o.eta}</p></div><strong>{o.fee === 0 ? t('Free') : money(o.fee)}</strong>
                  </label>
                ))}
              </div>
            </section>

            <section className="step">
              <h2><span>2</span> {t('Payment')}</h2>
              <div className="choices">
                {methods.map(m => (
                  <label key={m.id} className={'choice choice--row' + (pay === m.id ? ' on' : '')}>
                    <input type="radio" name="pay" checked={pay === m.id} onChange={() => { setPay(m.id); setBanner(''); }} />
                    <span className="choice__ic" aria-hidden="true">{m.icon}</span>
                    <div><b>{t(m.label)}</b><p>{t(m.hint)}</p></div>
                  </label>
                ))}
              </div>

              <div className="paypanel" aria-live="polite">
                {pay === 'card' && (
                  <div className="fields">
                    <Field label={t('Card number') + (card.number ? ' · ' + cardBrand(card.number) : '')} className="span2" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" {...cf('number')} onChange={e => setCard({ ...card, number: fmtCard(e.target.value) })} />
                    <Field label={t("Name on card")} className="span2" autoComplete="cc-name" {...cf('name')} onChange={e => setCard({ ...card, name: e.target.value })} />
                    <Field label={t("Expiry")} inputMode="numeric" autoComplete="cc-exp" placeholder={t("MM / YY")} {...cf('expiry')} onChange={e => setCard({ ...card, expiry: fmtExp(e.target.value) })} />
                    <Field label={t("CVC")} inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} {...cf('cvc')} onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') })} />
                    <p className="span2 muted small">{t('Test cards: {ok} succeeds · {no} is declined. Card data is checked and never stored.', { ok: <code>4242 4242 4242 4242</code>, no: <code>4000 0000 0000 0002</code> })}</p>
                  </div>
                )}
                {['paypal', 'momo', 'vnpay'].includes(pay) && <p className="muted">{t("You'll confirm the payment in a secure window after you place the order.")}</p>}
                {pay === 'bank' && <p className="muted">{t("We show our bank details on the next page. Your order is held for 24 hours and ships once the transfer arrives.")}</p>}
                {pay === 'cod' && <p className="muted">{t('Pay {amount} in cash to the courier. Please keep the exact amount ready.', { amount: money(tt.total) })}</p>}
              </div>
            </section>
          </div>

          <aside className="summary summary--sticky">
            <h2>{t("Order summary")}</h2>
            <OrderSummary method={ship} showItems />
            <div className="coupon">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder={t("Coupon code")} aria-label={t("Coupon code")} onKeyDown={e => { if (e.key === 'Enter') applyCode(e); }} />
              <button className="btn btn--ghost" type="button" disabled={!code.trim()} onClick={applyCode}><span>{t("Apply")}</span></button>
            </div>
            {(codeMsg || couponError) && <p className="form-error" role="alert">{codeMsg || couponError}</p>}
            {couponCode && !couponError && <p className="coupon__on">{t('Code {code} applied', { code: <b>{couponCode}</b> })} <button type="button" onClick={() => setCouponCode('')}>{t("remove")}</button></p>}
            <button className="btn btn--solid btn--block" type="submit" disabled={busy || hasIssues}>
              <span>{busy ? t('Placing order…') : t('Place order · {total}', { total: money(tt.total) })}</span>
            </button>
            <p className="summary__note">{t('By placing your order you agree to our {terms}. Secure, demo checkout.', { terms: <Link to="/policies/terms">{t('Terms')}</Link> })}</p>
            {hasIssues && <p className="form-error">{t('Some items in your bag are unavailable. {link}', { link: <Link to="/cart">{t('Review bag')}</Link> })}</p>}
          </aside>
        </form>
      </div>

      <PaySim method={pay} amount={tt.total} open={sim} busy={busy} onApprove={() => place({ approved: true })} onCancel={() => { setSim(false); setBanner(t('Payment was cancelled. You have not been charged.')); }} />
    </main>
  );
}
