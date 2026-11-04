import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { reduceMotion } from '../lib/utils.js';

/**
 * goto('orbit') — scrolls to a home section; from any other page it navigates
 * home first (Home reads `state.scrollTo` and scrolls once mounted).
 */
export function useGoto() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return useCallback(id => {
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  }, [pathname, navigate]);
}
