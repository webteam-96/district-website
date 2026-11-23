import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import RotaryAPI, { config, type RotaryConfig } from '../api/client';

interface TenantValue {
  ready: boolean;
  config: RotaryConfig; // live reference — read after `ready` is true
  setYear: (label: string) => void;
}

const TenantContext = createContext<TenantValue | null>(null);

// Changing the year mirrors the ASPX app.js exactly: store the short label
// (e.g. "2024-25") in sessionStorage and reload, so client.js ready() reads it
// and every page re-fetches for that year. Full reload = identical behaviour.
function setYear(label: string) {
  const m = /^(\d{4})-(\d{4})$/.exec(label); // "2024-2025" -> "2024-25"
  const shortLbl = m ? m[1] + '-' + m[2].slice(2) : label;
  try {
    sessionStorage.setItem('rid-year', shortLbl);
  } catch (e) {}
  window.location.reload();
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    RotaryAPI.ready().then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <TenantContext.Provider value={{ ready, config, setYear }}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider');
  return ctx;
}
