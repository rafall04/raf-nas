import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { capabilitiesFor, Role, ROLE_LABEL_ID } from '@rafnas/shared';
import { useWorkspace } from '../state/workspace';
import { useFileRefresh } from '../layout/AppShell';
import {
  createFolderApi,
  downloadNodeUrl,
  fetchNodes,
  HttpError,
  trashNode,
  type NodeDto,
  type NodesResponse,
} from '../lib/api';
import { formatBytes, formatDate } from '../data/types';
import { Icon } from '../ui/icons';
import { Badge, Button, EmptyState, FileTypeChip, RoleBadge } from '../ui/primitives';
import { CreateLinkDialog } from '../components/CreateLinkDialog';
import './filebrowser.css';

type ViewState = 'loading' | 'ok' | 'forbidden' | 'error';

function download(id: string): void {
  const a = document.createElement('a');
  a.href = downloadNodeUrl(id);
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function FileBrowser(): JSX.Element {
  const { spaceId } = useParams();
  const { spaces, loading: spacesLoading, refresh: refreshSpaces } = useWorkspace();
  const { key: refreshKey, bump } = useFileRefresh();
  const navigate = useNavigate();
  const space = spaces.find((s) => s.id === spaceId) ?? spaces[0];

  const [data, setData] = useState<NodesResponse | null>(null);
  const [view, setView] = useState<ViewState>('loading');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareNode, setShareNode] = useState<NodeDto | null>(null);

  const reload = useCallback(() => {
    if (!space) return;
    setView('loading');
    fetchNodes(space.id)
      .then((d) => {
        setData(d);
        setView('ok');
      })
      .catch((e: unknown) => setView(e instanceof HttpError && e.status === 403 ? 'forbidden' : 'error'));
  }, [space?.id]);

  useEffect(() => {
    setSel(new Set());
    setActiveId(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.id, refreshKey]);

  const role = data?.role ?? space?.role ?? Role.NONE;
  const caps = data?.caps ?? capabilitiesFor(role);
  const nodes = data?.nodes ?? [];
  const selectedNodes = nodes.filter((n) => sel.has(n.id));
  const activeNode = nodes.find((n) => n.id === activeId) ?? null;
  const totalSize = nodes.reduce((a, n) => a + n.sizeBytes, 0);
  const hasSel = sel.size > 0;

  function rowClick(n: NodeDto): void {
    setSel(new Set([n.id]));
    setActiveId(n.id);
  }
  function toggle(id: string, checked: boolean): void {
    setSel((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function trashSelected(): Promise<void> {
    setBusy(true);
    try {
      let failed = 0;
      for (const n of selectedNodes) {
        try {
          await trashNode(n.id);
        } catch {
          failed += 1;
        }
      }
      if (failed) window.alert(`${failed} item gagal dihapus (tidak cukup hak akses).`);
      setSel(new Set());
      setActiveId(null);
      reload();
      refreshSpaces();
    } finally {
      setBusy(false);
    }
  }

  async function newFolder(): Promise<void> {
    if (!space) return;
    const name = window.prompt('Nama folder baru:');
    if (!name) return;
    setBusy(true);
    try {
      await createFolderApi(space.id, name);
      bump();
    } catch {
      window.alert('Gagal membuat folder (nama sudah ada atau tidak cukup hak).');
    } finally {
      setBusy(false);
    }
  }

  if (spacesLoading && !space) {
    return <div className="fb"><div className="fb-main"><div className="fb-bar" /><TableSkeleton /></div></div>;
  }
  if (!space) {
    return <div className="fb"><div className="fb-main"><EmptyState title="Belum ada ruang." description="Minta akses ruang ke Admin IT." /></div></div>;
  }

  return (
    <div className="fb">
      <div className="fb-main">
        {hasSel ? (
          <div className="fb-bar sel">
            <span className="sel-count">{sel.size} item dipilih</span>
            <div className="fb-bar-spacer" />
            <Button size="sm" variant="ghost" disabled={!caps.download || selectedNodes.some((n) => n.isFolder)} onClick={() => selectedNodes.forEach((n) => !n.isFolder && download(n.id))}><Icon name="download" size={16} /> Unduh</Button>
            <Button size="sm" variant="ghost" disabled={!caps.download || sel.size !== 1 || (selectedNodes[0]?.isFolder ?? true)} onClick={() => selectedNodes[0] && setShareNode(selectedNodes[0])}><Icon name="share" size={16} /> Bagikan</Button>
            <Button size="sm" variant="ghost" disabled={!caps.move}>Pindahkan</Button>
            <Button size="sm" variant="ghost" disabled={!caps.deleteOwn || busy} onClick={() => void trashSelected()}><Icon name="trash" size={16} /> Hapus</Button>
            <button className="act" title="Kosongkan pilihan" onClick={() => setSel(new Set())}><Icon name="close" size={16} /></button>
          </div>
        ) : (
          <div className="fb-bar">
            <div className="crumb">
              <span>Ruang</span>
              <Icon name="chevron-right" size={14} />
              <span className="cur">{space.name}</span>
            </div>
            <div className="fb-bar-spacer" />
            {caps.upload && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void newFolder()}><Icon name="plus" size={16} /> Folder baru</Button>
            )}
          </div>
        )}

        {view === 'ok' && !caps.upload && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', background: 'var(--info-subtle)', borderBottom: '1px solid var(--info-border)' }}>
            <Icon name="info" size={16} /> Anda hanya punya akses baca di folder ini.
          </div>
        )}

        <div className="fb-table-wrap">
          {view === 'loading' && <TableSkeleton />}
          {view === 'forbidden' && <EmptyState title="Tidak ada akses." description="Anda tidak punya akses ke ruang ini. Minta akses ke Admin IT." />}
          {view === 'error' && <EmptyState title="Gagal memuat daftar file." description="Periksa koneksi lalu coba lagi." action={<Button size="sm" variant="secondary" onClick={reload}>Coba lagi</Button>} />}
          {view === 'ok' && nodes.length === 0 && (
            <EmptyState title="Folder ini masih kosong." description={caps.upload ? 'Tarik file ke sini atau klik Unggah.' : 'Minta akses unggah ke Admin IT.'} />
          )}
          {view === 'ok' && nodes.length > 0 && (
            <table className="fb-table">
              <thead>
                <tr>
                  <th className="col-check"></th>
                  <th className="col-type"></th>
                  <th>Nama</th>
                  <th className="col-size">Ukuran</th>
                  <th className="col-mod">Diubah</th>
                  <th className="col-by">Oleh</th>
                  <th className="col-act"></th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n) => (
                  <tr key={n.id} className={`fb-row${sel.has(n.id) ? ' selected' : ''}`} onClick={() => rowClick(n)}>
                    <td className="col-check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={sel.has(n.id)} onChange={(e) => toggle(n.id, e.target.checked)} aria-label={`Pilih ${n.name}`} />
                    </td>
                    <td className="col-type"><FileTypeChip ext={n.ext ?? undefined} isFolder={n.isFolder} /></td>
                    <td>
                      <div className="fb-name">
                        <span className="fb-name-text">{n.name}</span>
                        <span className="fb-badges">
                          {n.lockedBy && <Badge tone="warning">Terkunci</Badge>}
                          {n.shared && <Badge tone="info">Dibagikan</Badge>}
                        </span>
                      </div>
                    </td>
                    <td className="num">{n.isFolder ? `${n.itemCount ?? 0} item` : formatBytes(n.sizeBytes)}</td>
                    <td className="num">{formatDate(n.updatedAt)}</td>
                    <td style={{ color: 'var(--ink-secondary)' }}>{n.updatedBy}</td>
                    <td className="col-act" onClick={(e) => e.stopPropagation()}>
                      <div className="fb-actions">
                        <button className="act" title="Unduh" disabled={!caps.download || n.isFolder} onClick={() => download(n.id)}><Icon name="download" size={16} /></button>
                        <button className="act" title="Menu"><Icon name="more" size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="fb-status">
          <span>{nodes.length} item</span>
          <span className="mono">{formatBytes(totalSize)}</span>
          <span>· Peran Anda: {ROLE_LABEL_ID[role]}</span>
        </div>
      </div>

      <aside className="fb-detail">
        {selectedNodes.length === 0 && (
          <div className="fb-detail-empty">Pilih satu file untuk melihat metadata, akses, dan riwayat versinya.</div>
        )}
        {selectedNodes.length === 1 && activeNode && (
          <>
            <div className="fb-detail-head">
              <div className="fb-detail-title">
                <FileTypeChip ext={activeNode.ext ?? undefined} isFolder={activeNode.isFolder} />
                <span className="t">{activeNode.name}</span>
              </div>
              <div className="fb-detail-actions">
                <Button size="sm" variant="secondary" disabled={!caps.download || activeNode.isFolder} onClick={() => download(activeNode.id)}><Icon name="download" size={16} /> Unduh</Button>
                <Button size="sm" variant="ghost" disabled={activeNode.isFolder} onClick={() => navigate(`/pratinjau?node=${activeNode.id}&name=${encodeURIComponent(activeNode.name)}&ext=${activeNode.ext ?? ''}&cat=${activeNode.category}`)}>Pratinjau</Button>
                <Button size="sm" variant="ghost" disabled={!caps.download || activeNode.isFolder} onClick={() => setShareNode(activeNode)}><Icon name="share" size={16} /> Bagikan</Button>
              </div>
            </div>
            <div className="fb-meta">
              <div className="fb-meta-row"><span className="k">Tipe</span><span className="v">{activeNode.isFolder ? 'Folder' : (activeNode.ext ?? '—').toUpperCase()}</span></div>
              <div className="fb-meta-row"><span className="k">Ukuran</span><span className="v num">{activeNode.isFolder ? `${activeNode.itemCount ?? 0} item` : formatBytes(activeNode.sizeBytes)}</span></div>
              <div className="fb-meta-row"><span className="k">Diubah</span><span className="v num">{formatDate(activeNode.updatedAt)}</span></div>
              <div className="fb-meta-row"><span className="k">Oleh</span><span className="v">{activeNode.updatedBy}</span></div>
              <div className="fb-meta-row"><span className="k">Path</span><span className="v mono">/{space.name}/{activeNode.name}</span></div>
            </div>
            <div className="fb-section-label">Akses efektif Anda</div>
            <div className="fb-access">
              <div className="fb-access-row">
                <span style={{ color: 'var(--ink-secondary)', fontSize: 'var(--text-sm)' }}>{caps.upload ? 'Bisa unggah & ubah' : 'Hanya baca & unduh'}</span>
                <RoleBadge role={role} />
              </div>
            </div>
          </>
        )}
        {selectedNodes.length > 1 && (
          <div className="fb-meta" style={{ paddingTop: 20 }}>
            <div className="fb-meta-row"><span className="k">Dipilih</span><span className="v num">{selectedNodes.length} item</span></div>
            <div className="fb-meta-row"><span className="k">Total ukuran</span><span className="v num">{formatBytes(selectedNodes.reduce((a, n) => a + n.sizeBytes, 0))}</span></div>
          </div>
        )}
      </aside>

      {shareNode && (
        <CreateLinkDialog nodeId={shareNode.id} fileName={shareNode.name} onClose={() => setShareNode(null)} />
      )}
    </div>
  );
}

function TableSkeleton(): JSX.Element {
  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--surface-hover)' }} />
          <span style={{ height: 12, borderRadius: 4, background: 'var(--surface-hover)', width: `${45 + ((i * 29) % 45)}%` }} />
        </div>
      ))}
    </div>
  );
}
