import { useEffect, useState } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
}

/* Tiny data hook. `fetcher` is any promise-returning function (typically a
   RotaryAPI.* call — which internally waits for tenant resolution via ready()).
   Re-runs whenever `deps` change; ignores a stale resolution if deps changed or
   the component unmounted first. No React Query — this mirrors the ASPX's
   fetch-then-render-once model. */
export function useApi<T = any>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true, error: null });
    fetcher()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (alive) setState({ data: null, loading: false, error });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
