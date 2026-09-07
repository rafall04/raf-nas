import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { capabilitiesFor, Role, ROLE_LABEL_ID } from '@rafnas/shared';
import { useWorkspace } from '../state/workspace';
import { useFileRefresh } from '../layout/AppShell';
import { useToast } from '../state/toasts';
import {
  createFolderApi,
  downloadNodeUrl,
  nodeContentUrl,
  fetchNodes,
  fetchVersions,
  HttpError,
  renameNode,
  restoreNode,
  restoreVersion,
  trashNode,
  type NodeDto,
  type NodesResponse,
  type VersionDto,
} from '../lib/api';
import { formatBytes, formatDate } from '../data/types';
import { Icon } from '../ui/icons';
import { Badge, Button, EmptyState, FileTypeChip, RoleBadge } from '../ui/primitives';
import { ContextMenu, type MenuItem } from '../ui/ContextMenu';
import { Modal } from '../ui/Modal';
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

function previewUrl(n: NodeDto): string {
  return `/pratinjau?node=${n.id}&name=${encodeURIComponent(n.name)}&ext=${n.ext ?? ''}&cat=${n.category}`;
}

function lsBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : v === '1';
  } catch {
    return def;
  }
}
function lsSet(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* ignore */
  }
}

export function FileBrowser(): JSX.Element {
  const { spaceId } = useParams();
  const { spaces, loading: spacesLoading, refresh: refreshSpaces } = useWorkspace();
  const { key: refreshKey, bump } = useFileRefresh();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [sp, setSp] = useSearchParams();
  const path = sp.get('path') ?? '/';
  const pathSegs = path.split('/').filter(Boolean);
  const space = spaces.find((s) => s.id === spaceId) ?? spaces[0];

  const [data, setData] = useState<NodesResponse | null>(null);
  const [view, setView] = useState<ViewState>('loading');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareNode, setShareNode] = useState<NodeDto | null>(null);
  const [menu, setMenu] = useState<{ node: NodeDto; x: number; y: number } | null>(null);
  const [renameTarget, setRenameTarget] = useState<NodeDto | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [versions, setVersions] = useState<VersionDto[] | null>(null);
  const [dense, setDense] = useState<boolean>(() => lsBool('rafnas.dense', false));
  const [grid, setGrid] = useState<boolean>(() => lsBool('rafnas.grid', false));
  const [showDetail, setShowDetail] = useState<boolean>(() => lsBool('rafnas.detail', true));

  const reload = useCallback(() => {
    if (!space) return;
    setView('loading');
    fetchNodes(space.id, path)
      .then((d) => {
        setData(d);
        setView('ok');
      })
      .catch((e: unknown) => setView(e instanceof HttpError && e.status === 403 ? 'forbidden' : 'error'));
  }, [space?.id, path]);

  useEffect(() => {
    setSel(new Set());
    setActiveId(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.id, path, refreshKey]);

  const role = data?.role ?? space?.role ?? Role.NONE;
  const caps = data?.caps ?? capabilitiesFor(role);
  const nodes = data?.nodes ?? [];
  const selectedNodes = nodes.filter((n) => sel.has(n.id));
  const activeNode = nodes.find((n) => n.id === activeId) ?? null;
  const totalSize = nodes.reduce((a, n) => a + n.sizeBytes, 0);
  const hasSel = sel.size > 0;

  // Riwayat versi untuk satu file terpilih
  useEffect(() => {
    if (activeNode && !activeNode.isFolder) {
      setVersions(null);
      fetchVersions(activeNode.id).then(setVersions).catch(() => setVersions([]));
    } else {
      setVersions(null);
    }
  }, [activeNode?.id]);

  function rowClick(n: NodeDto): void {
    if (n.isFolder) {
      setSel(new Set());
      setActiveId(null);
      setSp({ path: n.path });
      return;
    }
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

  function openMenu(node: NodeDto, x: number, y: number): void {
    setSel(new Set([node.id]));
    setActiveId(node.id);
    setMenu({ node, x, y });
  }

  function menuItems(n: NodeDto): MenuItem[] {
    return [
      { label: 'Pratinjau', icon: 'file', disabled: n.isFolder, onClick: () => navigate(previewUrl(n)) },
      { label: 'Unduh', icon: 'download', disabled: n.isFolder || !caps.download, onClick: () => download(n.id) },
      { label: 'Ganti nama', icon: 'file', separatorBefore: true, disabled: !caps.rename, onClick: () => { setRenameTarget(n); setRenameValue(n.name); } },
      { label: 'Buat link berbagi', icon: 'share', disabled: n.isFolder || !caps.download, onClick: () => setShareNode(n) },
      { label: 'Pindahkan ke sampah', icon: 'trash', separatorBefore: true, danger: true, disabled: !caps.deleteOwn, onClick: () => void trashOne(n.id) },
    ];
  }

  async function trashOne(id: string): Promise<void> {
    setBusy(true);
    try {
      await trashNode(id);
      setSel(new Set());
      setActiveId(null);
      reload();
      refreshSpaces();
      notify('Dipindahkan ke sampah.', {
        tone: 'success',
        undo: () => void restoreNode(id).then(() => { reload(); refreshSpaces(); }).catch(() => notify('Gagal memulihkan.', { tone: 'danger' })),
      });
    } catch {
      notify('Gagal menghapus (tidak cukup hak akses).', { tone: 'danger' });
    } finally {
      setBusy(false);
    }
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
      if (failed) notify(`${failed} item gagal dihapus (tidak cukup hak akses).`, { tone: 'danger' });
      else notify(`${selectedNodes.length} item dipindahkan ke sampah.`, { tone: 'success' });
      setSel(new Set());
      setActiveId(null);
      reload();
      refreshSpaces();
    } finally {
      setBusy(false);
    }
  }

  async function doRename(): Promise<void> {
    if (!renameTarget) return;
    setBusy(true);
    try {
      await renameNode(renameTarget.id, renameValue.trim());
      setRenameTarget(null);
      reload();
      notify('Nama diganti.', { tone: 'success' });
    } catch {
      notify('Gagal mengganti nama (nama dipakai atau tidak cukup hak).', { tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function doRestoreVersion(vid: string): Promise<void> {
    if (!activeNode) return;
    setBusy(true);
    try {
      await restoreVersion(activeNode.id, vid);
      fetchVersions(activeNode.id).then(setVersions).catch(() => {});
      reload();
      notify('Versi dipulihkan.', { tone: 'success' });
    } catch {
      notify('Gagal memulihkan versi.', { tone: 'danger' });
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
      await createFolderApi(space.id, name, path);
      bump();
      notify('Folder dibuat.', { tone: 'success' });
    } catch {
      notify('Gagal membuat folder (nama sudah ada atau tidak cukup hak).', { tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  function onTableKey(e: { key: string; preventDefault(): void }): void {
    if (!nodes.length) return;
    const idx = activeId ? nodes.findIndex((n) => n.id === activeId) : -1;
    if (e.key === 'ArrowDown') { e.preventDefault(); const n = nodes[Math.min(nodes.length - 1, idx + 1)]; if (n) { setActiveId(n.id); setSel(new Set([n.id])); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const n = nodes[Math.max(0, idx <= 0 ? 0 : idx - 1)]; if (n) { setActiveId(n.id); setSel(new Set([n.id])); } }
    else if (e.key === 'Enter') { const n = idx >= 0 ? nodes[idx] : undefined; if (n) { if (n.isFolder) setSp({ path: n.path }); else navigate(previewUrl(n)); } }
    else if (e.key === ' ') { const n = idx >= 0 ? nodes[idx] : undefined; if (n) { e.preventDefault(); toggle(n.id, !sel.has(n.id)); } }
  }
  function toggleDense(): void { setDense((v) => { lsSet('rafnas.dense', v ? '0' : '1'); return !v; }); }
  function toggleGrid(): void { setGrid((v) => { lsSet('rafnas.grid', v ? '0' : '1'); return !v; }); }
  function toggleDetail(): void { setShowDetail((v) => { lsSet('rafnas.detail', v ? '0' : '1'); return !v; }); }

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
              <span className="crumb-link" onClick={() => setSp({})}>Ruang</span>
              <Icon name="chevron-right" size={14} />
              <span className={pathSegs.length ? 'crumb-link' : 'cur'} onClick={() => pathSegs.length && setSp({})}>{space.name}</span>
              {pathSegs.map((seg, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  <Icon name="chevron-right" size={14} />
                  <span className={i === pathSegs.length - 1 ? 'cur' : 'crumb-link'} onClick={() => i < pathSegs.length - 1 && setSp({ path: '/' + pathSegs.slice(0, i + 1).join('/') })}>{seg}</span>
                </span>
              ))}
            </div>
            <div className="fb-bar-spacer" />
            {caps.upload && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void newFolder()}><Icon name="plus" size={16} /> Folder baru</Button>
            )}
            <Button size="sm" variant="ghost" onClick={toggleDense}>{dense ? 'Normal' : 'Padat'}</Button>
            <button className={`fb-viewbtn${grid ? ' on' : ''}`} title="Tampilan grid" onClick={toggleGrid}><Icon name="grid" size={16} /></button>
            <button className={`fb-viewbtn${!grid ? ' on' : ''}`} title="Tampilan daftar" onClick={() => grid && toggleGrid()}><Icon name="list" size={16} /></button>
            <button className={`fb-viewbtn${showDetail ? ' on' : ''}`} title="Panel detail" onClick={toggleDetail}><Icon name="panel" size={16} /></button>
          </div>
        )}

        {view === 'ok' && !caps.upload && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', background: 'var(--info-subtle)', borderBottom: '1px solid var(--info-border)' }}>
            <Icon name="info" size={16} /> Anda hanya punya akses baca di folder ini.
          </div>
        )}

        <div className="fb-table-wrap" tabIndex={0} onKeyDown={onTableKey}>
          {view === 'loading' && <TableSkeleton />}
          {view === 'forbidden' && <EmptyState title="Tidak ada akses." description="Anda tidak punya akses ke ruang ini. Minta akses ke Admin IT." />}
          {view === 'error' && <EmptyState title="Gagal memuat daftar file." description="Periksa koneksi lalu coba lagi." action={<Button size="sm" variant="secondary" onClick={reload}>Coba lagi</Button>} />}
          {view === 'ok' && nodes.length === 0 && (
            <EmptyState title="Folder ini masih kosong." description={caps.upload ? 'Tarik file ke sini atau klik Unggah.' : 'Minta akses unggah ke Admin IT.'} />
          )}
          {view === 'ok' && nodes.length > 0 && !grid && (
            <table className={`fb-table${dense ? ' compact' : ''}`}>
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
                  <tr
                    key={n.id}
                    className={`fb-row${sel.has(n.id) ? ' selected' : ''}`}
                    onClick={() => rowClick(n)}
                    onContextMenu={(e) => { e.preventDefault(); openMenu(n, e.clientX, e.clientY); }}
                  >
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
                        <button className="act" title="Menu" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); openMenu(n, r.left, r.bottom); }}><Icon name="more" size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {view === 'ok' && nodes.length > 0 && grid && (
            <div className="fb-grid">
              {nodes.map((n) => (
                <button
                  key={n.id}
                  className={`fb-card${sel.has(n.id) ? ' selected' : ''}`}
                  onClick={() => rowClick(n)}
                  onContextMenu={(e) => { e.preventDefault(); openMenu(n, e.clientX, e.clientY); }}
                >
                  <span className="fb-card-thumb">
                    {n.isFolder ? <Icon name="folder" size={30} /> : n.category === 'image' ? <img src={nodeContentUrl(n.id)} alt="" /> : <FileTypeChip ext={n.ext ?? undefined} />}
                  </span>
                  <span className="fb-card-name">{n.name}</span>
                  <span className="fb-card-meta mono">{n.isFolder ? `${n.itemCount ?? 0} item` : formatBytes(n.sizeBytes)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="fb-status">
          <span>{nodes.length} item</span>
          <span className="mono">{formatBytes(totalSize)}</span>
          <span>· Peran Anda: {ROLE_LABEL_ID[role]}</span>
        </div>
      </div>

      {showDetail && (
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
                <Button size="sm" variant="ghost" disabled={activeNode.isFolder} onClick={() => navigate(previewUrl(activeNode))}>Pratinjau</Button>
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
            {!activeNode.isFolder && (
              <>
                <div className="fb-section-label">Riwayat versi</div>
                <div className="fb-access">
                  {versions === null && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)' }}>Memuat…</span>}
                  {versions?.slice(0, 3).map((v) => (
                    <div className="fb-access-row" key={v.id}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }} className="num">{formatDate(v.createdAt)} · {formatBytes(v.sizeBytes)}</span>
                      {v.isCurrent ? <Badge tone="success">Saat ini</Badge> : <Button size="sm" variant="ghost" disabled={!caps.rename || busy} onClick={() => void doRestoreVersion(v.id)}>Pulihkan</Button>}
                    </div>
                  ))}
                  {versions?.length === 0 && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)' }}>Belum ada versi.</span>}
                </div>
              </>
            )}
          </>
        )}
        {selectedNodes.length > 1 && (
          <div className="fb-meta" style={{ paddingTop: 20 }}>
            <div className="fb-meta-row"><span className="k">Dipilih</span><span className="v num">{selectedNodes.length} item</span></div>
            <div className="fb-meta-row"><span className="k">Total ukuran</span><span className="v num">{formatBytes(selectedNodes.reduce((a, n) => a + n.sizeBytes, 0))}</span></div>
          </div>
        )}
      </aside>
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems(menu.node)} onClose={() => setMenu(null)} />
      )}

      {shareNode && (
        <CreateLinkDialog nodeId={shareNode.id} fileName={shareNode.name} onClose={() => setShareNode(null)} />
      )}

      {renameTarget && (
        <Modal
          size="sm"
          title="Ganti nama"
          onClose={() => setRenameTarget(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setRenameTarget(null)}>Batal</Button>
              <Button variant="primary" disabled={busy || !renameValue.trim()} onClick={() => void doRename()}>Simpan</Button>
            </>
          }
        >
          <input
            autoFocus
            style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && renameValue.trim()) void doRename(); }}
          />
        </Modal>
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
