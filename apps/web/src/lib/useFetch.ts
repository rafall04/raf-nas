import { useEffect, useState } from 'react';
import { HttpError } from './api';

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  forbidden: boolean;
  error: boolean;
  reload: () => void;
}

/** Ambil data sekali saat mount; `reload()` untuk memuat ulang. 403 → forbidden. */
export function useFetch<T>(fn: () => Promise<T>): FetchState<T> {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<Omit<FetchState<T>, 'reload'>>({
    data: null,
    loading: true,
    forbidden: false,
    error: false,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, forbidden: false, error: false }));
    fn()
      .then((d) => alive && setState({ data: d, loading: false, forbidden: false, error: false }))
      .catch((e: unknown) => {
        if (!alive) return;
        const forbidden = e instanceof HttpError && e.status === 403;
        setState({ data: null, loading: false, forbidden, error: !forbidden });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
