import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../ui/icons';
import './uploads.css';

type Status = 'uploading' | 'done' | 'error';
interface Item {
  id: number;
  name: string;
  pct: number;
  status: Status;
}
interface UploadValue {
  upload: (spaceId: string, path: string, files: File[]) => void;
}

const UploadContext = createContext<UploadValue>({ upload: () => {} });
export function useUpload(): UploadValue {
  return useContext(UploadContext);
}

export function UploadProvider({
  onComplete,
  children,
}: {
  onComplete?: () => void;
  children: ReactNode;
}): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const active = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const patch = useCallback((id: number, p: Partial<Item>) => {
    setItems((x) => x.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const upload = useCallback<UploadValue['upload']>(
    (spaceId, path, files) => {
      setCollapsed(false);
      for (const f of files) {
        const id = Date.now() + Math.random();
        setItems((x) => [...x, { id, name: f.name, pct: 0, status: 'uploading' }]);
        active.current += 1;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/spaces/${spaceId}/upload?path=${encodeURIComponent(path)}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) patch(id, { pct: Math.round((e.loaded / e.total) * 100) });
        };
        const finish = (status: Status): void => {
          patch(id, { pct: 100, status });
          active.current -= 1;
          if (active.current <= 0) onCompleteRef.current?.();
        };
        xhr.onload = () => finish(xhr.status >= 200 && xhr.status < 300 ? 'done' : 'error');
        xhr.onerror = () => finish('error');
        const fd = new FormData();
        fd.append('file', f);
        xhr.send(fd);
      }
    },
    [patch],
  );

  const uploadingCount = items.filter((i) => i.status === 'uploading').length;
  const failedCount = items.filter((i) => i.status === 'error').length;
  const allDone = items.length > 0 && uploadingCount === 0;

  return (
    <UploadContext.Provider value={{ upload }}>
      {children}
      {items.length > 0 && (
        <div className="up-panel">
          <div className={`up-head${allDone && !failedCount ? ' success' : ''}${failedCount ? ' danger' : ''}`}>
            <div style={{ flex: 1 }}>
              <div className="up-title">
                {uploadingCount > 0
                  ? `Mengunggah ${uploadingCount} file…`
                  : failedCount
                    ? `${items.length - failedCount} selesai, ${failedCount} gagal`
                    : `${items.length} file selesai diunggah`}
              </div>
            </div>
            <button className="up-icon" title={collapsed ? 'Buka' : 'Ciutkan'} onClick={() => setCollapsed((v) => !v)}>
              <Icon name="chevron-down" size={16} className={collapsed ? 'flip-up' : ''} />
            </button>
            <button className="up-icon" title="Tutup" onClick={() => setItems([])}><Icon name="close" size={16} /></button>
          </div>
          {!collapsed && (
            <div className="up-list">
              {items.map((it) => (
                <div className="up-file" key={it.id}>
                  <span className={`up-dot up-${it.status}`} />
                  <div className="up-file-main">
                    <div className="up-file-name">{it.name}</div>
                    <div className="up-bar"><span style={{ width: `${it.pct}%`, background: it.status === 'error' ? 'var(--danger)' : undefined }} /></div>
                  </div>
                  <span className="up-status mono">{it.status === 'error' ? 'gagal' : it.status === 'done' ? '✓' : `${it.pct}%`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </UploadContext.Provider>
  );
}
