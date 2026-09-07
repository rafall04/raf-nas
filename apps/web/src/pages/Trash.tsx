import { useCallback, useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button, EmptyState, FileTypeChip } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { emptyTrash, fetchTrash, restoreNode, type TrashItemDto } from '../lib/api';
import './pages.css';

export function Trash(): JSX.Element {
  const [items, setItems] = useState<TrashItemDto[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    fetchTrash()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function restore(id: string): Promise<void> {
    setBusy(true);
    try {
      await restoreNode(id);
      reload();
    } catch {
      window.alert('Gagal memulihkan (tidak cukup hak akses).');
    } finally {
      setBusy(false);
    }
  }

  async function doEmpty(): Promise<void> {
    setBusy(true);
    try {
      await emptyTrash();
      setConfirm(false);
      setTyped('');
      reload();
    } catch {
      window.alert('Gagal mengosongkan sampah.');
    } finally {
      setBusy(false);
    }
  }

  const rows = items ?? [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Sampah</h1>
          <p>File terhapus bisa dipulihkan sebelum terhapus permanen (retensi 30 hari).</p>
        </div>
        <Button variant="danger" disabled={rows.length === 0} onClick={() => setConfirm(true)}>
          <Icon name="trash" size={16} /> Kosongkan sampah
        </Button>
      </div>

      <div className="page-body">
        <div className="banner-info">
          <Icon name="info" size={16} />
          File di sampah tetap memakai kuota ruang asalnya sampai terhapus permanen.
        </div>

        {items !== null && rows.length === 0 ? (
          <EmptyState title="Sampah kosong." description="File yang Anda hapus akan muncul di sini." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Nama</th><th>Lokasi asal</th><th>Dihapus oleh</th><th>Sisa waktu</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.id}>
                  <td>
                    <span className="name-cell2">
                      <FileTypeChip ext={it.ext ?? undefined} isFolder={it.isFolder} />
                      <span className="t">{it.name}</span>
                    </span>
                  </td>
                  <td title={it.originPath}>{it.originName}</td>
                  <td className="mono">{it.by}</td>
                  <td>
                    {it.daysLeft <= 3 ? (
                      <span className="warn-days"><Icon name="info" size={14} /> {it.daysLeft} hari lagi</span>
                    ) : (
                      <span className="mono">{it.daysLeft} hari</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void restore(it.id)}>Pulihkan</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirm && (
        <Modal
          size="sm"
          title="Kosongkan sampah?"
          onClose={() => { setConfirm(false); setTyped(''); }}
          footer={
            <>
              <Button variant="ghost" onClick={() => { setConfirm(false); setTyped(''); }}>Batal</Button>
              <Button variant="danger" disabled={typed !== 'HAPUS' || busy} onClick={() => void doEmpty()}>Hapus permanen</Button>
            </>
          }
        >
          <p style={{ margin: '0 0 14px', fontSize: 'var(--text-md)', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
            Semua file sampah di ruang yang Anda kelola akan dihapus <b>permanen</b> dan tak bisa dipulihkan. Ketik <b>HAPUS</b> untuk konfirmasi.
          </p>
          <input
            style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}
            placeholder="HAPUS"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </Modal>
      )}
    </div>
  );
}
