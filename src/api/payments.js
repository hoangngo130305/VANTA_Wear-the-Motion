import { ApiError, db, sleep } from './db.js';
import { randomId } from './crypto.js';
import { t } from '../i18n/index.js';

/**
 * Payment gateway SIMULATION. Nothing here moves money.
 * Real integration = create the payment on your server with Stripe / VNPay / MoMo / PayPal keys
 * and replace `process()` with a call to that endpoint. Card numbers are validated and then thrown away:
 * only brand + last4 are ever kept.
 */
export const PAYMENT_METHODS = [
  { id: 'card',   label: 'Credit / debit card', hint: 'Visa, Mastercard, JCB',          icon: '💳', online: true },
  { id: 'paypal', label: 'PayPal',              hint: 'Pay with your PayPal balance',    icon: '🅿️', online: true },
  { id: 'momo',   label: 'MoMo wallet',         hint: 'Scan the QR in the MoMo app',     icon: '📱', online: true },
  { id: 'vnpay',  label: 'VNPay QR',            hint: 'Any Vietnamese banking app',      icon: '🏦', online: true },
  { id: 'bank',   label: 'Bank transfer',       hint: 'Order ships after we receive it', icon: '🧾', online: false },
  { id: 'cod',    label: 'Cash on delivery',    hint: 'Pay when the parcel arrives',     icon: '💵', online: false }
];

export const luhn = num => {
  const d = String(num).replace(/\D/g, '');
  if (d.length < 12) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) { let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; }
  return sum % 10 === 0;
};
export const cardBrand = num => {
  const d = String(num).replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^35/.test(d)) return 'JCB';
  if (/^3[47]/.test(d)) return 'Amex';
  return 'Card';
};

export function validateCard({ number, name, expiry, cvc }) {
  const errors = {};
  if (!luhn(number)) errors.number = 'Enter a valid card number.';
  if (String(name || '').trim().length < 2) errors.name = 'Name on card is required.';
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry || '');
  if (!m || +m[1] < 1 || +m[1] > 12) errors.expiry = 'Use MM / YY.';
  else if (new Date(2000 + +m[2], +m[1], 0, 23, 59) < new Date()) errors.expiry = 'This card has expired.';
  if (!/^\d{3,4}$/.test(cvc || '')) errors.cvc = '3 or 4 digits.';
  return errors;
}

/** → {status:'paid'|'pending', ref, detail}. Throws ApiError when the payment is declined. */
export async function processPayment(method, data = {}, amount) {
  if (!db().settings.payments[method]) throw new ApiError(t('This payment method is not available.'), 422, 'payment');
  await sleep(700);
  switch (method) {
    case 'card': {
      const errs = validateCard(data);
      if (Object.keys(errs).length) throw new ApiError(t('Please check your card details.'), 422, 'card');
      const digits = data.number.replace(/\D/g, '');
      if (digits === '4000000000000002') throw new ApiError(t('Your card was declined.'), 402, 'card');
      if (digits === '4000000000009995') throw new ApiError(t('Insufficient funds on this card.'), 402, 'card');
      return { status: 'paid', ref: 'ch_' + randomId(12), detail: `${cardBrand(digits)} •••• ${digits.slice(-4)}` };
    }
    case 'paypal': case 'momo': case 'vnpay':
      if (!data.approved) throw new ApiError(t('Payment was cancelled.'), 402, 'payment');
      return { status: 'paid', ref: method + '_' + randomId(10), detail: PAYMENT_METHODS.find(m => m.id === method).label };
    case 'bank':
      return { status: 'pending', ref: 'TRF-' + randomId(6).toUpperCase(), detail: 'Awaiting bank transfer' };
    case 'cod':
      return { status: 'pending', ref: 'COD', detail: 'Cash on delivery' };
    default:
      throw new ApiError(t('Choose a payment method.'), 422, 'payment');
  }
}
