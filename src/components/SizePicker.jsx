import { t } from '../i18n/index.js';

/** Size chips. Pass `stock` ({size: qty}) to disable sold-out sizes and flag low stock. `shakeKey` replays the "pick a size" shake. */
export default function SizePicker({ sizes, value, onChange, shakeKey = 0, label, stock }) {
  return (
    <div className="sizes" role="radiogroup" aria-label={label} key={shakeKey}>
      {sizes.map(s => {
        const left = stock ? (stock[s] ?? 0) : null;
        const out = left !== null && left <= 0;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={s === value}
            disabled={out}
            title={out ? t('Sold out') : left !== null && left <= 3 ? t('Only {n} left', { n: left }) : undefined}
            className={'sz' + (shakeKey ? ' shake' : '') + (out ? ' sz--out' : '') + (left !== null && left > 0 && left <= 3 ? ' sz--low' : '')}
            onClick={() => onChange(s)}
          >{s}</button>
        );
      })}
    </div>
  );
}
