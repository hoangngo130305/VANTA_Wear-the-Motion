import { ANGLES } from '../hooks/useTurntable.js';
import { gImg, sImg } from '../data/catalog.js';
import { Rotate } from './Icons.jsx';
import { pName } from '../i18n/helpers.js';
import { t } from '../i18n/index.js';

/** garments with a full photo set get the cross-fading turntable; everything else spins as one image */
export const modeOf = product => (product.views ? 'g' : 's');

export const VIEWS = {
  g: [['Front', 0], ['Side', 90], ['Back', 180]],
  s: [['Side view', 0], ['Opposite side', 180]]
};

/** The draggable 360° stage. `tt` is the object returned by useTurntable(). */
export default function Turntable({ product, tt, className = '' }) {
  const mode = modeOf(product);
  return (
    <div className={'qv__media ' + className} data-cursor={t("Drag")} {...tt.mediaProps}>
      <div className="qv__glow" />
      <div className={'qv__spin' + (mode === 's' ? ' is-shoe' : '')} ref={tt.spinRef}>
        {mode === 'g'
          ? ANGLES.map((l, i) => (
            <div className="l" key={i} ref={el => { tt.layers.current[i] = el; }}>
              <img src={gImg(product, l.v)} alt={`${pName(product)} — ${t(l.v)}`} draggable="false" style={l.m < 0 ? { transform: 'scaleX(-1)' } : undefined} />
            </div>
          ))
          : <div className="l"><img src={product.kind === 's' ? sImg(product) : gImg(product)} alt={pName(product)} draggable="false" /></div>}
      </div>
      <p className="qv__hint" style={{ opacity: tt.hintHidden ? 0 : 1 }}><Rotate />{t("Drag to rotate 360°")}</p>
    </div>
  );
}
