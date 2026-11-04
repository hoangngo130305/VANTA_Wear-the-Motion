import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGoto } from '../hooks/useGoto.js';
import { clamp, money } from '../lib/utils.js';
import { Close } from './Icons.jsx';
import { itemName } from '../i18n/helpers.js';
import { t } from '../i18n/index.js';

export default function CartDrawer() {
  const { lines, count, subtotal, freeFrom, hasIssues, cartOpen, closeCart, changeQty, removeItem } = useStore();
  const { requireLogin } = useAuth();
  const navigate = useNavigate();
  const goto = useGoto();
  const left = freeFrom - subtotal;

  const checkout = () => {
    closeCart();
    if (requireLogin('checkout')) navigate('/checkout');
  };

  return (
    <div className={'cart' + (cartOpen ? ' open' : '') + (count === 0 ? ' is-empty' : '')} aria-hidden={!cartOpen}>
      <div className="cart__bd" onClick={closeCart} />
      <aside className="cart__box" role="dialog" aria-label={t("Your bag")}>
        <header>
          <h3>{t('Your bag')} <span>({count})</span></h3>
          <button type="button" aria-label={t("Close bag")} onClick={closeCart}><Close /></button>
        </header>

        <div className="cart__ship">
          <p>{left > 0 ? t("You're {amount} away from free shipping", { amount: <b>{money(left)}</b> }) : t("🎉 You've unlocked {free}", { free: <b>{t('free shipping')}</b> })}</p>
          <div><i className={left <= 0 ? 'full' : ''} style={{ width: clamp(subtotal / freeFrom, 0, 1) * 100 + '%' }} /></div>
        </div>

        <ul className="cart__list">
          {lines.map(it => (
            <li className="ci" key={it.key}>
              <div className="ci__img"><img src={it.img} alt="" /></div>
              <div>
                <h4><Link to={`/product/${it.id}`} onClick={closeCart}>{itemName(it)}</Link></h4><small>{it.size}</small>
                {(it.unavailable || it.overStock) && <small className="ci__warn">{it.unavailable ? t('No longer available') : t('Only {n} left', { n: it.max })}</small>}
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

        <div className="cart__empty">
          <p>{t("Your bag is empty.")}</p>
          <a href="#/" className="btn btn--ghost" onClick={e => { e.preventDefault(); closeCart(); goto('orbit'); }}><span>{t("Start shopping")}</span></a>
        </div>

        <footer id="cartFoot">
          <div className="cart__sub"><span>{t("Subtotal")}</span><b>{money(subtotal)}</b></div>
          <button className="btn btn--solid btn--block" type="button" disabled={hasIssues} onClick={checkout}><span>{t("Checkout")}</span></button>
          <Link className="cart__more" to="/cart" onClick={closeCart}>{t("View full bag & add a coupon")}</Link>
        </footer>
      </aside>
    </div>
  );
}
