import { useContent } from '../context/CatalogContext.jsx';
import { asset } from '../data/catalog.js';

/** brand mark: an uploaded logo image if the admin set one, otherwise the built-in glyph + wordmark */
export default function Logo() {
  const { brand } = useContent();
  if (brand.logo) return <img className="logo__img" src={asset(brand.logo)} alt={brand.name} />;
  return (
    <>
      <svg viewBox="0 0 34 24" aria-hidden="true"><path d="M0 0h8.5L17 16.5 25.5 0H34L21.4 24h-8.8z" fill="currentColor" /></svg>
      <b>{brand.name}</b>
    </>
  );
}
