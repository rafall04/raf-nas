import { Badge, Button } from '../../ui/primitives';

interface LinkRow {
  slug: string;
  object: string;
  by: string;
  expires: string;
  hits: number;
  status: 'active' | 'soon' | 'expired' | 'revoked';
}

const LINKS: LinkRow[] = [
  { slug: 'a1b2c3d4e5f6', object: '/Produksi/SOP-Pengelasan-Rev4.pdf', by: 'budi.s', expires: '14 Sep 2026', hits: 7, status: 'active' },
  { slug: 'g7h8i9j0k1l2', object: '/QC/Rekap-Reject-Mingguan.xlsx', by: 'citra.l', expires: '9 Sep 2026', hits: 22, status: 'soon' },
  { slug: 'm3n4o5p6q7r8', object: '/Gudang/Foto-Stok-Agustus (folder)', by: 'dedi.p', expires: '1 Sep 2026', hits: 5, status: 'expired' },
  { slug: 's9t0u1v2w3x4', object: '/Maintenance/Manual-Kompressor.pdf', by: 'eka.r', expires: '—', hits: 0, status: 'revoked' },
];

function statusBadge(s: LinkRow['status']): JSX.Element {
  if (s === 'active') return <Badge tone="success">Aktif</Badge>;
  if (s === 'soon') return <Badge tone="warning">Segera habis</Badge>;
  if (s === 'expired') return <Badge tone="info">Kedaluwarsa</Badge>;
  return <Badge tone="danger">Dicabut</Badge>;
}

export function ActiveLinks(): JSX.Element {
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Link aktif</h1>
          <p>Semua link berbagi di seluruh sistem. Tanpa halaman ini, dalam setahun akan ada puluhan link terbuka tanpa ada yang tahu.</p>
        </div>
        <Button variant="secondary" size="md" disabled>
          Cabut terpilih
        </Button>
      </div>
      <div className="adm-content">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Objek</th>
              <th>Slug</th>
              <th>Pembuat</th>
              <th>Kedaluwarsa</th>
              <th>Akses</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {LINKS.map((l) => (
              <tr key={l.slug} className={l.status === 'expired' || l.status === 'revoked' ? 'row-off' : ''}>
                <td className="mono" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.object}</td>
                <td className="mono">{l.slug}</td>
                <td className="mono">{l.by}</td>
                <td className="mono">{l.expires}</td>
                <td className="mono">{l.hits}</td>
                <td>{statusBadge(l.status)}</td>
                <td style={{ textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" disabled={l.status === 'revoked' || l.status === 'expired'}>
                    Cabut
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
