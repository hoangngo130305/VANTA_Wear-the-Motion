import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeDb } from '../api/db.js';
import { readProducts } from '../api/products.js';
import { readContent } from '../api/content.js';
import { readCategories } from '../api/categories.js';
import { readSettings } from '../api/settings.js';
import { setVndRate } from '../i18n/index.js';

const Ctx = createContext(null);
export const useCatalog = () => useContext(Ctx);
export const useContent = () => useContext(Ctx).content;

/**
 * Live data from the db: products, editable site content (CMS) and settings.
 * Re-renders whenever an admin edits something or an order changes stock.
 * Content keeps its raw {en, vi} objects — components localize at render time.
 */
export function CatalogProvider({ children }) {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeDb(() => setVersion(v => v + 1)), []);

  const value = useMemo(() => {
    const settings = readSettings();
    setVndRate(settings.vndRate);
    const content = readContent();
    const categories = readCategories();
    const catById = Object.fromEntries(readCategories({ includeInactive: true }).map(c => [c.id, c]));
    const products = readProducts().filter(p => !catById[p.category] || catById[p.category].active);
    const byId = Object.fromEntries(products.map(p => [p.id, p]));
    const garments = products.filter(p => p.kind === 'g');
    const shoes = products.filter(p => p.kind === 's');
    return {
      products, byId, garments, shoes, content, settings, categories, catById,
      rail: garments.filter(p => p.views),                                  // pieces that have a full 360° photo set
      scenes: content.hero.slides.filter(s => byId[s.product]),
      looks: content.runway.looks.map(l => ({ ...l, pieces: l.products.map(id => byId[id]).filter(Boolean) })).filter(l => l.pieces.length),
      version
    };
  }, [version]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
