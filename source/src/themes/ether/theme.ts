import { createContext, useContext } from 'react';

/* Ether ships dark by default with a light alternative; the choice is remembered.
   index.html applies the saved theme before first paint, so there is no flash. */
export type Theme = 'dark' | 'light';
export const ThemeCtx = createContext<Theme>('dark');
export const useTheme = () => useContext(ThemeCtx);
export const KEY = 'ether-theme';
export const readTheme = (): Theme => {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
};
export const saveTheme = (t: Theme) => {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#f3f6fb' : '#040a1a');
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
};
