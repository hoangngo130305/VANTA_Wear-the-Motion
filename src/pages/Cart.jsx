import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { clamp, money } from '../lib/utils.js';
import { Breadcrumbs, Empty } from '../components/ui/index.jsx';
import { previewCoupon } from '../api/coupons.js';
import OrderSummary from '../components/OrderSummary.jsx';
import { itemName } from '../i18n/helpers.js';
import { t, rich } from '../i18n/index.js';

export default function Cart() {
  const { lines, count, subtotal, freeFrom, hasIssues, changeQty, removeItem, couponCode, setCouponCode, couponError } = useStore();
  const { user, requireLogin } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const left = freeFrom - subtotal;

  const apply = async e => {
    e.preventDefault();
    setMsg('');
    try { const c = await previewCoupon(code, subtotal); setCouponCode(c.code); setCode(''); }
    catch (err) { setMsg(err.message); }
  };
  const checkout = () => { if (requireLogin('checkout')) navigate('/checkout'); };

  return (
    <main className="page">
      <div className="wrap">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Your bag' }]} />
        <h1 className="h2 page__title">{rich(t('Your\n*bag.*'))}</h1>

        {count === 0 ? (
          <Empty title={t("Your bag is empty")} text={t("Pieces you add will wait for you here.")} action={<Link className="btn btn--solid" to="/shop"><span>{t("Browse the shop")}</span></Link>} />
        ) : (
          <div className="cartpage">
            <div>
              <div className="cart__ship cart__ship--page">
                <p>{left > 0 ? t("You're {amount} away from free standard shipping", { amount: <b>{money(left)}</b> }) : t('🎉 Free standard shipping unlocked')}</p>
                <div><i className={left <= 0 ? 'full' : ''} style={{ width: clamp(subtotal / freeFrom, 0, 1) * 100 + '%' }} /></div>
              </div>
              <ul className="cartpage__list">
                {lines.map(it => (
                  <li key={it.key} className={'ci ci--page' + (it.unavailable || it.overStock ? ' ci--bad' : '')}>
                    <Link to={`/product/${it.id}`} className="ci__img"><img src={it.img} alt="" /></Link>
                    <div>
                      <h4><Link to={`/product/${it.id}`}>{itemName(it)}</Link></h4>
                      <small>{it.size}</small>
                      {(it.unavailable || it.overStock) && <small className="ci__warn">{it.unavailable ? t('No longer available — remove to continue') : t('Only {n} left — reduce quantity', { n: it.max })}</small>}
                      <div className="qty">
                        <button type="button" aria-label={t("Decrease")} onClick={() => changeQty(it.key, -1)}>−</button>
                        <span>{it.qty}</span>
                        <button type="button" aria-label={t("Increase")} disabled={it.qty >= it.max} onClick={() => changeQty(it.key, 1)}>+</button>
                      </div>
                    </div>
                    <div className="ci__r"><b>{money(it.price * it.qty)}</b><button type="button" className="ci__rm" onClick={() => removeItem(it.key)}>{t("Remove")}</button></div>
                  </li>
                ))}
              </ul>
              <Link className="link" to="/shop"><span>{t("Continue shopping")}</span></Link>
            </div>

            <aside className="summary">
              <h2>{t("Order summary")}</h2>
              <form className="coupon" onSubmit={apply}>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder={t("Coupon code")} aria-label={t("Coupon code")} />
                <button className="btn btn--ghost" type="submit" disabled={!code.trim()}><span>{t("Apply")}</span></button>
              </form>
              {(msg || couponError) && <p className="form-error" role="alert">{msg || couponError}</p>}
              {couponCode && !couponError && (
                <p className="coupon__on">{t('Code {code} applied', { code: <b>{couponCode}</b> })} <button type="button" onClick={() => setCouponCode('')}>{t("remove")}</button></p>
              )}
              <OrderSummary />
              <button className="btn btn--solid btn--block" type="button" disabled={hasIssues} onClick={checkout}>
                <span>{user ? t('Proceed to checkout') : t('Sign in to checkout')}</span>
              </button>
              {!user && <p className="summary__note">{t("You can browse and fill your bag as a guest. A free account is needed to pay — it keeps your order history, addresses and returns in one place.")}</p>}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
