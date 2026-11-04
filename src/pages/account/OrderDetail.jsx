import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { cancelOrder, getOrder } from '../../api/orders.js';
import { useStore } from '../../context/StoreContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { money } from '../../lib/utils.js';
import { sizeKey } from '../../data/catalog.js';
import { itemName } from '../../i18n/helpers.js';
import { PayBadge, StatusBadge, Timeline, fmtDate, methodLabel } from '../../components/OrderParts.jsx';
import { Modal, Spinner, useAsync } from '../../components/ui/index.jsx';
import { t } from '../../i18n/index.js';

/** Shared by the customer (/account/orders/:id) and by admins viewing the same order. */
export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const { byId, version } = useCatalog();
  const { addToCart, openCart, showToast } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [qr, setQr] = useState('');
  const op = useAsync();

  useEffect(() => {
    let live = true;
    getOrder(id).then(o => live && setOrder({ ...o })).catch(e => live && setError(e.message));
    return () => { live = false; };
  }, [id, version]);

  useEffect(() => {
    if (order?.payment.method === 'bank' && order.payment.status === 'unpaid') {
      QRCode.toDataURL(`vanta-demo-transfer://acct=0123456789&amt=${order.total}&ref=${order.id}`, { margin: 1, width: 200 }).then(setQr).catch(() => {});
    }
  }, [order]);

  if (error) return <div className="panel"><p className="form-error">{error}</p><Link className="link" to="/account/orders"><span>{t("Back to orders")}</span></Link></div>;
  if (!order) return <div className="panel"><Spinner /></div>;

  const canCancel = ['pending', 'processing'].includes(order.status);
  const cancel = async () => { const o = await op.run(() => cancelOrder(order.id)); if (o) { setOrder({ ...o }); setConfirm(false); showToast(<><span className="tick">✓</span><span>{t('Order {id} cancelled.', { id: o.id })}</span></>); } };

  const reorder = () => {
    let n = 0;
    order.items.forEach(i => { const p = byId[i.productId]; if (p && addToCart(p, sizeKey(i.size), i.qty, { quiet: true })) n++; });
    if (n) openCart(); else showToast(<span>{t("Those items are no longer available.")}</span>);
  };

  const s = order.shipping;
  return (
    <div className="orderpage">
      {state?.justPlaced && (
        <div className="thanks">
          <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="m14 27 8 8 16-17" /></svg>
          <div>
            <h2>{t("Thank you — order placed!")}</h2>
            <p>{t("We've received order {id}.", { id: <b>{order.id}</b> })} {order.payment.status === 'paid' ? t('Payment confirmed — we are packing it now.') : order.payment.method === 'bank' ? t('Please complete the bank transfer below to start processing.') : t('You will pay the courier on delivery.')}</p>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel__head">
          <div><h2>{t('Order {id}', { id: order.id })}</h2><small className="muted">{t('Placed {date}', { date: fmtDate(order.createdAt, true) })}</small></div>
          <div className="row gap"><StatusBadge status={order.status} /><PayBadge status={order.payment.status} /></div>
        </div>
        <Timeline order={order} />
      </div>

      {order.payment.method === 'bank' && order.payment.status === 'unpaid' && order.status !== 'cancelled' && (
        <div className="panel panel--soft transfer">
          {qr && <img src={qr} alt={t("Bank transfer QR code")} />}
          <div>
            <h3>{t("Bank transfer details")}</h3>
            <dl>
              <div><dt>{t("Bank")}</dt><dd>{t("VANTA Demo Bank")}</dd></div><div><dt>{t("Account")}</dt><dd>0123 456 789</dd></div>
              <div><dt>{t("Amount")}</dt><dd>{money(order.total)}</dd></div><div><dt>{t("Reference")}</dt><dd><b>{order.id}</b></dd></div>
            </dl>
            <p className="muted small">{t("Include the reference so we can match your payment. Demo store — no real account.")}</p>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>{t("Items")}</h2>
        <ul className="osum__items osum__items--lg">
          {order.items.map((l, i) => (
            <li key={i}>
              <Link to={`/product/${l.productId}`} className="osum__img"><img src={l.img} alt="" /><em>{l.qty}</em></Link>
              <div><b><Link to={`/product/${l.productId}`}>{itemName(l)}</Link></b><small>{l.size} · {t('{price} each', { price: money(l.price) })}</small>
                {order.status === 'delivered' && byId[l.productId] && <Link className="ci__rm" to={`/product/${l.productId}#reviews`}>{t("Write a review")}</Link>}</div>
              <span>{money(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="osum__dl">
          <div><dt>{t("Subtotal")}</dt><dd>{money(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="osum__disc"><dt>{t('Discount ({code})', { code: order.coupon?.code })}</dt><dd>−{money(order.discount)}</dd></div>}
          <div><dt>{t('Shipping ({method})', { method: t(s.method) })}</dt><dd>{order.shippingFee ? money(order.shippingFee) : t('Free')}</dd></div>
          <div className="osum__total"><dt>{t("Total")}</dt><dd>{money(order.total)}</dd></div>
        </dl>
      </div>

      <div className="grid2">
        <div className="panel"><h2>{t("Shipping to")}</h2><address>{s.name}<br />{s.phone}<br />{s.line1}<br />{s.city}, {s.province} {s.zip}<br />{t(s.country)}</address></div>
        <div className="panel"><h2>{t("Payment")}</h2><p>{methodLabel(order.payment.method)}</p><p className="muted">{t(order.payment.detail)}</p><p className="muted small">{t('Ref:')} {order.payment.ref}</p></div>
      </div>

      <div className="row gap wrap-row noprint">
        <button className="btn btn--solid" type="button" onClick={reorder}><span>{t("Order again")}</span></button>
        <button className="btn btn--ghost" type="button" onClick={() => window.print()}><span>{t("Print invoice")}</span></button>
        {canCancel && <button className="btn btn--ghost btn--danger" type="button" onClick={() => setConfirm(true)}><span>{t("Cancel order")}</span></button>}
        <Link className="link" to="/account/orders"><span>{t("All orders")}</span></Link>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t("Cancel this order?")}>
        <p className="muted">{order.payment.status === 'paid' ? t("Items go back into stock and your payment will be refunded in 3–5 working days. This can't be undone.") : t("Items go back into stock. This can't be undone.")}</p>
        {op.error && <p className="form-error" role="alert">{op.error}</p>}
        <div className="modal__actions">
          <button className="btn btn--solid btn--danger" type="button" disabled={op.loading} onClick={cancel}><span>{op.loading ? t('Cancelling…') : t('Yes, cancel order')}</span></button>
          <button className="btn btn--ghost" type="button" onClick={() => setConfirm(false)}><span>{t("Keep order")}</span></button>
        </div>
      </Modal>
    </div>
  );
}
