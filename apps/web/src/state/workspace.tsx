import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchSpaces, type SpaceDto } from '../lib/api';

interface WorkspaceValue {
  spaces: SpaceDto[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }): JSX.Element {
  const [spaces, setSpaces] = useState<SpaceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchSpaces()
      .then((s) => {
        setSpaces(s);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <WorkspaceContext.Provider value={{ spaces, loading, error, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace harus di dalam WorkspaceProvider');
  return ctx;
}
