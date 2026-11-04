import { Badge } from './ui/index.jsx';
import { PAYMENT_METHODS } from '../api/payments.js';
import { fmtDate as formatDate, t } from '../i18n/index.js';

const STATUS_TONE = { pending: 'warn', processing: 'info', shipped: 'info', delivered: 'ok', cancelled: 'dark', returned: 'dark' };
const PAY_TONE = { paid: 'ok', unpaid: 'warn', refunded: 'dark' };

export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'neutral'}>{t(status)}</Badge>;
export const PayBadge = ({ status }) => <Badge tone={PAY_TONE[status] || 'neutral'}>{t(status)}</Badge>;
export const methodLabel = id => { const m = PAYMENT_METHODS.find(x => x.id === id); return m ? t(m.label) : id; };
export const fmtDate = formatDate;

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];
const LABEL = { pending: 'Order placed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned' };

/** Horizontal progress for normal orders, plus the full event log underneath. */
export function Timeline({ order }) {
  const idx = STEPS.indexOf(order.status);
  const ended = ['cancelled', 'returned'].includes(order.status);
  return (
    <div className="tl">
      {!ended && (
        <ol className="tl__steps" aria-label={t('Order progress')}>
          {STEPS.map((s, i) => (
            <li key={s} className={i < idx ? 'done' : i === idx ? 'now' : ''}><i>{i < idx ? '✓' : i + 1}</i><span>{t(LABEL[s])}</span></li>
          ))}
        </ol>
      )}
      {ended && <p className="notice notice--dark">{t('This order was {status}.', { status: t(order.status) })}</p>}
      <ul className="tl__log">
        {[...order.timeline].reverse().map((e, i) => (
          <li key={i}><b>{t(LABEL[e.status] || e.status)}</b><small>{fmtDate(e.at, true)}</small>{e.note && <p>{t(e.note)}{e.detail ? ` (${t(e.detail)})` : ''}</p>}</li>
        ))}
      </ul>
    </div>
  );
}
