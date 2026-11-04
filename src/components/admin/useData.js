import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';

/** Run an async api read, and re-run it whenever the underlying data changes (db version) or deps change. */
export function useData(fn, deps = []) {
  const { version } = useCatalog();
  const [state, setState] = useState({ data: null, error: '' });
  useEffect(() => {
    let live = true;
    fn().then(data => live && setState({ data, error: '' })).catch(e => live && setState({ data: null, error: e.message }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
  return { ...state, loading: state.data === null && !state.error };
}
