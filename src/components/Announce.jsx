import { useCatalog } from '../context/CatalogContext.jsx';
import { fillText } from '../i18n/index.js';
import { money } from '../lib/utils.js';

/** scrolling top bar — messages are editable in Admin → Content → Announcement bar */
export default function Announce() {
  const { content: { announce }, settings } = useCatalog();
  if (!announce.enabled || !announce.items.length) return null;
  const vars = { free: money(settings.freeShippingFrom) };
  const row = [...announce.items, ...announce.items];
  return (
    <div className="announce">
      <div className="announce__track">
        {row.map((m, i) => (
          <span key={i} style={{ display: 'contents' }}><span>{fillText(m.text, vars)}</span><i>✦</i></span>
        ))}
      </div>
    </div>
  );
}
