import { createContext, useContext } from 'react';

/* Orbit is light by default with a dark alternative; the choice is remembered and
   applied by index.html before first paint. */
export type Theme = 'dark' | 'light';
export const ThemeCtx = createContext<Theme>('light');
export const useTheme = () => useContext(ThemeCtx);
const KEY = 'orbit-theme';
export const readTheme = (): Theme => {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
};
export const saveTheme = (t: Theme) => {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#120c30' : '#17103f');
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
};
