import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeDb } from '../api/db.js';
import * as auth from '../api/auth.js';
import { can as canDo } from '../api/permissions.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.publicUser(auth.sessionUser()));
  const [prompt, setPrompt] = useState(null);        // {reason} → "sign in to continue" modal

  // db changes (wishlist, profile, another tab) → refresh the user
  useEffect(() => subscribeDb(() => setUser(auth.publicUser(auth.sessionUser()))), []);

  const login = useCallback(async creds => { const u = await auth.login(creds); setUser(u); return u; }, []);
  const register = useCallback(async data => { const u = await auth.register(data); setUser(u); return u; }, []);
  const logout = useCallback(() => { auth.logout(); setUser(null); }, []);

  /** returns true when allowed; otherwise opens the sign-in prompt explaining why */
  const requireLogin = useCallback(reason => {
    if (auth.sessionUser()) return true;
    setPrompt({ reason });
    return false;
  }, []);

  const toggleWish = useCallback(async id => {
    if (!requireLogin('wishlist')) return null;
    const u = await auth.toggleWishlist(id);
    setUser(u);
    return u.wishlist.includes(id);
  }, [requireLogin]);

  const value = useMemo(() => ({
    user, isAdmin: user?.role === 'admin', isCustomer: !!user, login, register, logout, requireLogin, toggleWish,
    can: key => canDo(user, key), prompt, closePrompt: () => setPrompt(null), setUser
  }), [user, login, register, logout, requireLogin, toggleWish, prompt]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
