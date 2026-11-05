import { createContext, useContext } from 'react';

/* Cascade is light by default with a dark alternative; the choice is remembered and
   applied by index.html before first paint. */
export type Theme = 'dark' | 'light';
export const ThemeCtx = createContext<Theme>('light');
export const useTheme = () => useContext(ThemeCtx);
const KEY = 'cascade-theme';
export const readTheme = (): Theme => {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
};
export const saveTheme = (t: Theme) => {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#1a0716' : '#2b0a25');
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
};
