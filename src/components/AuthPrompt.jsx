import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from './ui/index.jsx';
import { t } from '../i18n/index.js';

const COPY = {
  checkout: ['Sign in to check out', 'Your bag is saved. Create a free account or sign in to pay — we use it to track your order and handle returns.'],
  wishlist: ['Sign in to save favourites', 'Wishlists live in your account so they follow you across devices.'],
  review: ['Sign in to review', 'Reviews are tied to an account so they stay honest.']
};

/** Pop-up shown when a guest tries an action that needs an account. */
export default function AuthPrompt() {
  const { prompt, closePrompt } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  // any navigation (links, back button, typed URL) dismisses the prompt
  useEffect(() => { closePrompt(); }, [loc.pathname]);   // eslint-disable-line react-hooks/exhaustive-deps

  const [title, text] = (COPY[prompt?.reason] || ['Sign in to continue', 'You need an account for this.']).map(x => t(x));
  const go = to => { closePrompt(); navigate(to, { state: { from: loc.pathname + loc.search, reason: prompt?.reason } }); };

  return (
    <Modal open={!!prompt} onClose={closePrompt} title={title}>
      <p className="muted" style={{ marginBottom: 18 }}>{text}</p>
      <ul className="perks">
        <li>{t("Track orders from placed to delivered")}</li><li>{t("Saved addresses & faster checkout")}</li><li>{t("Wishlist, reviews and easy returns")}</li><li>{t('Use code {code} on your first order', { code: <b>{t("WELCOME10")}</b> })}</li>
      </ul>
      <div className="modal__actions">
        <button className="btn btn--solid" type="button" onClick={() => go('/login')}><span>{t("Sign in")}</span></button>
        <button className="btn btn--ghost" type="button" onClick={() => go('/register')}><span>{t("Create account")}</span></button>
      </div>
    </Modal>
  );
}
