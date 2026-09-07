import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadNodeUrl, fetchNodes, fetchSpaces, type NodeDto, type SpaceDto } from '../lib/api';
import { formatBytes, formatDate } from '../data/types';
import { FileTypeChip } from '../ui/primitives';
import { Icon } from '../ui/icons';
import './mobile.css';

export function Mobile(): JSX.Element {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<SpaceDto[]>([]);
  const [active, setActive] = useState<SpaceDto | null>(null);
  const [nodes, setNodes] = useState<NodeDto[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [sheet, setSheet] = useState<NodeDto | null>(null);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    fetchSpaces()
      .then((ss) => {
        setSpaces(ss);
        setActive(ss[0] ?? null);
      })
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (active) fetchNodes(active.id).then((d) => setNodes(d.nodes)).catch(() => setNodes([]));
  }, [active?.id]);

  function download(id: string): void {
    const a = document.createElement('a');
    a.href = downloadNodeUrl(id);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="mobile-wrap">
      <div className="mobile-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Kembali ke desktop</button>
        <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>Frame 390px</span>
      </div>

      <div className="phone">
        {!authed ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-secondary)', fontSize: 'var(--text-sm)' }}>
            Silakan masuk lewat tampilan desktop dulu, lalu buka halaman ini lagi.
          </div>
        ) : (
          <>
            <div className="m-header">
              <button className="m-icon" onClick={() => setDrawer(true)} aria-label="Menu"><Icon name="list" size={20} /></button>
              <div className="m-title-wrap">
                <div className="m-title">{active?.name ?? '—'}</div>
                <div className="m-sub mono">/{active?.name ?? ''}</div>
              </div>
              <button className="m-icon" aria-label="Cari"><Icon name="search" size={20} /></button>
              <button className="m-icon" aria-label="Menu"><Icon name="more" size={20} /></button>
            </div>

            <div className="m-list">
              {nodes.map((n) => (
                <button className="m-row" key={n.id} onClick={() => setSheet(n)}>
                  <FileTypeChip ext={n.ext ?? undefined} isFolder={n.isFolder} />
                  <div className="m-row-main">
                    <div className="m-row-name">{n.name}</div>
                    <div className="m-row-meta mono">
                      {n.isFolder ? `${n.itemCount ?? 0} item` : formatBytes(n.sizeBytes)}
                      <span className="m-sep" />
                      {formatDate(n.updatedAt)}
                    </div>
                  </div>
                  <span className="m-row-more"><Icon name="more" size={18} /></span>
                </button>
              ))}
              {nodes.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-tertiary)', fontSize: 'var(--text-sm)' }}>Folder kosong.</div>}
            </div>

            <button className="m-fab" aria-label="Foto & unggah"><Icon name="camera" size={24} /></button>

            {drawer && (
              <div className="m-drawer-scrim" onClick={() => setDrawer(false)}>
                <div className="m-drawer" onClick={(e) => e.stopPropagation()}>
                  <div className="m-drawer-head"><span className="sb-logo">RAF</span><span style={{ fontWeight: 600 }}>RAF NAS</span></div>
                  <div className="m-drawer-label">Ruang</div>
                  {spaces.map((s) => (
                    <button className="m-drawer-item" key={s.id} onClick={() => { setActive(s); setDrawer(false); }}>
                      <Icon name="folder" size={18} /> {s.name}
                      <span className="mono" style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>{s.fileCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sheet && (
              <div className="m-sheet-scrim" onClick={() => setSheet(null)}>
                <div className="m-sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="m-grab" />
                  <div className="m-sheet-file">
                    <FileTypeChip ext={sheet.ext ?? undefined} isFolder={sheet.isFolder} />
                    <div>
                      <div className="m-row-name">{sheet.name}</div>
                      <div className="m-row-meta mono">{sheet.isFolder ? `${sheet.itemCount ?? 0} item` : formatBytes(sheet.sizeBytes)} · {formatDate(sheet.updatedAt)}</div>
                    </div>
                  </div>
                  <div className="m-sheet-actions">
                    <button className="m-action" disabled={sheet.isFolder} onClick={() => download(sheet.id)}><Icon name="download" size={20} /><span>Unduh</span></button>
                    <button className="m-action"><Icon name="share" size={20} /><span>Bagikan</span></button>
                    <button className="m-action"><Icon name="file" size={20} /><span>Versi</span></button>
                    <button className="m-action"><Icon name="trash" size={20} /><span>Hapus</span></button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
