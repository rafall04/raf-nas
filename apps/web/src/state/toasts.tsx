import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import './toasts.css';

type Tone = 'info' | 'success' | 'danger';
interface Toast {
  id: number;
  msg: string;
  tone: Tone;
  undo?: () => void;
}
interface ToastValue {
  notify: (msg: string, opts?: { tone?: Tone; undo?: () => void }) => void;
}

const ToastContext = createContext<ToastValue>({ notify: () => {} });
export function useToast(): ToastValue {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback<ToastValue['notify']>(
    (msg, opts) => {
      const id = Date.now() + Math.random();
      const tone = opts?.tone ?? 'info';
      setToasts((t) => [...t, { id, msg, tone, undo: opts?.undo }]);
      if (tone !== 'danger') window.setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`} role="status">
            <span className="toast-msg">{t.msg}</span>
            {t.undo && (
              <button
                className="toast-undo"
                onClick={() => {
                  t.undo?.();
                  remove(t.id);
                }}
              >
                Urungkan
              </button>
            )}
            <button className="toast-x" aria-label="Tutup" onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
