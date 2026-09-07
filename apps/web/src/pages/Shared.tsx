import { useCallback, useEffect, useState } from 'react';
import { fetchShareLinks, revokeShareLink, type LinkStatus, type MyLinkDto } from '../lib/api';
import { Badge, Button, EmptyState } from '../ui/primitives';
import { Icon } from '../ui/icons';
import './pages.css';

function statusBadge(s: LinkStatus): JSX.Element {
  switch (s) {
    case 'ACTIVE':
      return <Badge tone="success">Aktif</Badge>;
    case 'SOON':
      return <Badge tone="warning">Segera habis</Badge>;
    case 'EXPIRED':
      return <Badge tone="info">Kedaluwarsa</Badge>;
    case 'LIMIT_REACHED':
      return <Badge tone="info">Batas tercapai</Badge>;
    default:
      return <Badge tone="danger">Dicabut</Badge>;
  }
}

export function Shared(): JSX.Element {
  const [links, setLinks] = useState<MyLinkDto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const reload = useCallback(() => {
    fetchShareLinks()
      .then(setLinks)
      .catch(() => setLinks([]));
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);

  function copy(slug: string): void {
    void navigator.clipboard?.writeText(`${window.location.origin}/l/${slug}`).then(() => {
      setCopied(slug);
      window.setTimeout(() => setCopied(null), 1500);
    });
  }
  async function revoke(id: string): Promise<void> {
    setBusy(true);
    try {
      await revokeShareLink(id);
      reload();
    } catch {
      window.alert('Gagal mencabut link.');
    } finally {
      setBusy(false);
    }
  }

  const rows = links ?? [];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>File dibagikan</h1>
          <p>Link berbagi milik Anda. Buat link lewat tombol <b>Bagikan</b> di File Browser. Setiap akses tercatat di audit.</p>
        </div>
      </div>

      <div className="page-body">
        {links !== null && rows.length === 0 ? (
          <EmptyState title="Belum ada link berbagi." description="Pilih sebuah file di File Browser lalu klik Bagikan." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>File</th><th>Slug</th><th>Dibuat</th><th>Kedaluwarsa</th><th>Unduhan</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className={l.status === 'EXPIRED' || l.status === 'REVOKED' ? 'row-off' : ''}>
                  <td className="t">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {l.file}
                      {l.hasPassword && <Icon name="lock" size={13} />}
                    </span>
                  </td>
                  <td className="mono">{l.slug}</td>
                  <td className="mono">{new Date(l.created).toLocaleDateString('id-ID')}</td>
                  <td className="mono">{new Date(l.expires).toLocaleDateString('id-ID')}</td>
                  <td className="mono">{l.hits}</td>
                  <td>{statusBadge(l.status)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Button size="sm" variant="ghost" onClick={() => copy(l.slug)}>{copied === l.slug ? 'Tersalin' : 'Salin'}</Button>
                    <Button size="sm" variant="ghost" disabled={busy || l.status === 'REVOKED'} onClick={() => void revoke(l.id)}>Cabut</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
