import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import Ticker from '../components/Ticker.jsx';
import Rail from '../components/Rail.jsx';
import Orbit from '../components/Orbit.jsx';
import Runway from '../components/Runway.jsx';
import Story from '../components/Story.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { tc } from '../i18n/index.js';


export default function Home({ started }) {
  const { state } = useLocation();
  const { scenes, rail, shoes, looks, content } = useCatalog();
  const a = content.tickers.a.map(x => tc(x.text)).filter(Boolean), b = content.tickers.b.map(x => tc(x.text)).filter(Boolean);

  // arriving from another page with a target section (header links, search)
  useEffect(() => {
    if (!state?.scrollTo) return;
    const t = setTimeout(() => document.getElementById(state.scrollTo)?.scrollIntoView({ behavior: 'auto' }), 80);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <main id="top">
      {scenes.length > 0 && <Hero started={started} />}
      {a.length > 0 && <Ticker words={a} dir={1} />}
      {rail.length > 0 && <Rail />}
      {shoes.length > 1 && <Orbit />}
      {b.length > 0 && <Ticker words={b} dir={-1} dark />}
      {looks.length > 0 && <Runway />}
      <Story />
    </main>
  );
}
