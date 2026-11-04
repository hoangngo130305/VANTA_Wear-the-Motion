import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LANGS, getLang, setLang } from './index.js';

const Ctx = createContext({ lang: 'en', change: () => {} });
export const useLang = () => useContext(Ctx);

/** Holds the active language. App.jsx keys the page tree on `lang`, so changing it re-renders every string. */
export function LangProvider({ children }) {
  const [lang, setState] = useState(getLang());
  const change = useCallback(next => { setLang(next); setState(next); }, []);
  const value = useMemo(() => ({ lang, change }), [lang, change]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** EN | VI toggle */
export function LangSwitch({ className = '' }) {
  const { lang, change } = useLang();
  return (
    <div className={'langsw ' + className} role="group" aria-label="Language / Ngôn ngữ">
      {LANGS.map(l => (
        <button key={l.code} type="button" className={lang === l.code ? 'on' : ''} aria-pressed={lang === l.code} lang={l.code} title={l.label} onClick={() => change(l.code)}>{l.short}</button>
      ))}
    </div>
  );
}
