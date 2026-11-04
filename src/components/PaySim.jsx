import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from './ui/index.jsx';
import { money } from '../lib/utils.js';
import { t } from '../i18n/index.js';

const BRAND = {
  paypal: { name: 'PayPal', color: '#0070e0', how: 'Log in to PayPal and approve the payment.' },
  momo: { name: 'MoMo', color: '#a50064', how: 'Open the MoMo app → Scan QR → confirm.' },
  vnpay: { name: 'VNPay', color: '#005ba6', how: 'Open any banking app → Scan VNPay QR → confirm.' }
};

/** Stand-in for a gateway redirect / hosted payment page. Approve or decline to see both outcomes. */
export default function PaySim({ method, amount, open, busy, onApprove, onCancel }) {
  const [qr, setQr] = useState('');
  const b = BRAND[method] || BRAND.paypal;

  useEffect(() => {
    if (!open || method === 'paypal') return;
    let live = true;
    QRCode.toDataURL(`vanta-demo-pay://${method}?amount=${amount}&ts=${Date.now()}`, { margin: 1, width: 220, color: { dark: '#0c0c0d', light: '#ffffff' } })
      .then(u => live && setQr(u)).catch(() => {});
    return () => { live = false; };
  }, [open, method, amount]);

  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel} title={t('Pay with {name}', { name: b.name })}>
      <div className="paysim">
        <div className="paysim__brand" style={{ background: b.color }}>{b.name}</div>
        <p className="paysim__amt">{money(amount)}</p>
        {method === 'paypal'
          ? <p className="muted">{t(b.how)}</p>
          : <><div className="paysim__qr">{qr ? <img src={qr} alt={t('{name} payment QR code', { name: b.name })} /> : <span className="spinner" />}</div><p className="muted">{t(b.how)}</p></>}
        <p className="paysim__note">{t("Demo only — no real payment is made.")}</p>
        <div className="modal__actions">
          <button className="btn btn--solid" type="button" disabled={busy} onClick={onApprove}><span>{busy ? t('Processing…') : method === 'paypal' ? t('Approve payment') : t("I've paid")}</span></button>
          <button className="btn btn--ghost" type="button" disabled={busy} onClick={onCancel}><span>{t("Cancel")}</span></button>
        </div>
      </div>
    </Modal>
  );
}
