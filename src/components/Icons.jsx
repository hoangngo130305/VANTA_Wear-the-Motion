const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const ArrowRight = () => <svg {...base}><path d="M5 12h14m-5-6 6 6-6 6" /></svg>;
export const ArrowLeft = () => <svg {...base}><path d="M19 12H5m5-6-6 6 6 6" /></svg>;
export const ArrowUpRight = () => <svg {...base}><path d="M7 17 17 7M8 7h9v9" /></svg>;
export const Close = () => <svg {...base}><path d="m6 6 12 12M18 6 6 18" /></svg>;
export const Rotate = () => <svg {...base}><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4h-4" /></svg>;
export const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const BagIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
);
