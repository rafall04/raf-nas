import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiLogin, apiLogout, apiMe, type PublicUser } from '../lib/api';

interface SessionValue {
  user: PublicUser | null;
  /** null = masih memeriksa /me, true/false = hasil. */
  authed: boolean | null;
  login: (username: string, password: string, code?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    apiMe()
      .then((u) => alive && (setUser(u), setAuthed(true)))
      .catch(() => alive && (setUser(null), setAuthed(false)));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      authed,
      login: async (username, password, code) => {
        const u = await apiLogin(username, password, code);
        setUser(u);
        setAuthed(true);
      },
      logout: async () => {
        await apiLogout();
        setUser(null);
        setAuthed(false);
      },
      refresh: async () => {
        try {
          const u = await apiMe();
          setUser(u);
          setAuthed(true);
        } catch {
          setUser(null);
          setAuthed(false);
        }
      },
    }),
    [user, authed],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession harus di dalam SessionProvider');
  return ctx;
}
