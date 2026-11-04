import { useState } from 'react';
import { useContent } from '../context/CatalogContext.jsx';
import { rich, t } from '../i18n/index.js';

export default function Newsletter() {
  const { newsletter } = useContent();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState({ text: '', error: false });

  const submit = e => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setMsg({ text: t('Please enter a valid email address.'), error: true });
      return;
    }
    setMsg({ text: t("✓ You're on the list — see you Friday 19:00."), error: false });
    setEmail('');
  };

  return (
    <section className="news">
      <div className="wrap news__in">
        <h2 className="h2 light">{rich(newsletter.title)}</h2>
        <form className="news__form" onSubmit={submit} noValidate>
          <label htmlFor="email" className="sr">{t('Email')}</label>
          <input id="email" type="email" placeholder={t('you@email.com')} autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn btn--lime" type="submit"><span>{t('Notify me')}</span></button>
          <p className="news__msg" role="status" style={msg.error ? { color: '#ff8a6b' } : undefined}>{msg.text}</p>
        </form>
      </div>
    </section>
  );
}
