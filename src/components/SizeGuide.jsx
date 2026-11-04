import { Modal } from './ui/index.jsx';
import { SIZE_GUIDE } from '../data/catalog.js';
import { t } from '../i18n/index.js';

export default function SizeGuide({ open, onClose, kind = 'g' }) {
  const tbl = kind === 's' ? SIZE_GUIDE.shoes : SIZE_GUIDE.garments;
  return (
    <Modal open={open} onClose={onClose} title={kind === 's' ? t('Sneaker size guide') : t('Apparel size guide')}>
      <table className="table table--plain">
        <thead><tr>{tbl.head.map(h => <th key={h}>{t(h)}</th>)}</tr></thead>
        <tbody>{tbl.rows.map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{i === 0 ? <b>{c}</b> : c}</td>)}</tr>)}</tbody>
      </table>
      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
        {kind === 's' ? t('Measure your foot from heel to longest toe. If you are between sizes, go up half a size.') : t('Our pieces are cut oversized. Between sizes? Take your usual size for the intended look, size down for a closer fit.')}
      </p>
    </Modal>
  );
}
