import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { t } from '../i18n/index.js';

/** Wishlist toggle. Guests get the "sign in" prompt (wishlists need an account). */
export default function HeartButton({ productId, className = '' }) {
  const { user, toggleWish } = useAuth();
  const { showToast } = useStore();
  const [pop, setPop] = useState(0);
  const on = !!user?.wishlist.includes(productId);

  const click = async e => {
    e.preventDefault(); e.stopPropagation();
    const now = await toggleWish(productId);
    if (now === null) return;
    setPop(p => p + 1);
    showToast(<><span className="tick">{now ? '♥' : '✓'}</span><span>{now ? t('Saved to your wishlist') : t('Removed from wishlist')}</span></>, 2200);
  };

  return (
    <button type="button" key={pop} className={'heart ' + className + (on ? ' on' : '') + (pop ? ' pop' : '')} aria-pressed={on} aria-label={on ? t('Remove from wishlist') : t('Add to wishlist')} onClick={click}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S3.5 15.4 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6C20.5 15.4 12 20.5 12 20.5z" /></svg>
    </button>
  );
}
