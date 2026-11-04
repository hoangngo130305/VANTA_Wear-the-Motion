import { useStore } from '../context/StoreContext.jsx';
import { money } from '../lib/utils.js';
import { t } from '../i18n/index.js';
import { itemName } from '../i18n/helpers.js';

/** Totals block (subtotal / discount / shipping / total) for the bag and the checkout sidebar. */
export default function OrderSummary({ method = 'standard', showItems = false }) {
  const { lines, totals, coupon } = useStore();
  const tot = totals(method);
  return (
    <div className="osum">
      {showItems && (
        <ul className="osum__items">
          {lines.map(l => (
            <li key={l.key}>
              <div className="osum__img"><img src={l.img} alt="" /><em>{l.qty}</em></div>
              <div><b>{itemName(l)}</b><small>{l.size}</small></div>
              <span>{money(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl>
        <div><dt>{t("Subtotal")}</dt><dd>{money(tot.subtotal)}</dd></div>
        {tot.discount > 0 && <div className="osum__disc"><dt>{t('Discount ({code})', { code: coupon.code })}</dt><dd>−{money(tot.discount)}</dd></div>}
        <div><dt>{t("Shipping")}</dt><dd>{tot.shipping === 0 ? t('Free') : money(tot.shipping)}</dd></div>
        <div className="osum__total"><dt>{t("Total")}</dt><dd>{money(tot.total)}</dd></div>
      </dl>
    </div>
  );
}
