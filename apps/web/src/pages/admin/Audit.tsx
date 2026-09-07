import { useFetch } from '../../lib/useFetch';
import { fetchAudit } from '../../lib/api';
import { Button } from '../../ui/primitives';
import { Icon } from '../../ui/icons';
import { AdminPage } from './AdminPage';

type Kind = 'info' | 'warning' | 'danger';

function kindOf(action: string): Kind {
  const a = action.toLowerCase();
  if (a.includes('hapus') || a.includes('kosongkan') || a.includes('cabut')) return 'danger';
  if (a.includes('hak akses') || a.includes('nonaktif') || a.includes('sandi')) return 'warning';
  return 'info';
}
const TINT: Record<Kind, string> = { info: 'var(--tint-info)', warning: 'var(--tint-warning)', danger: 'var(--tint-danger)' };
const DOT: Record<Kind, string> = { info: 'var(--primary)', warning: 'var(--warning)', danger: 'var(--danger)' };

export function Audit(): JSX.Element {
  const state = useFetch(fetchAudit);
  const rows = state.data ?? [];
  return (
    <AdminPage
      title="Audit"
      subtitle="Setiap aksi tercatat. Append-only, retensi 24 bulan."
      state={state}
      actions={<Button variant="secondary" size="md"><Icon name="download" size={16} /> Ekspor CSV</Button>}
    >
      <table className="adm-table">
        <thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Objek</th><th>IP</th></tr></thead>
        <tbody>
          {rows.map((a, i) => {
            const k = kindOf(a.action);
            return (
              <tr key={i} style={{ background: TINT[k] }}>
                <td className="mono">{new Date(a.time).toLocaleString('id-ID')}</td>
                <td className="mono">{a.user}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOT[k] }} />
                    {a.action}
                  </span>
                </td>
                <td className="mono" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.object}</td>
                <td className="mono">{a.ip}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={5} style={{ color: 'var(--ink-tertiary)', textAlign: 'center', padding: 24 }}>Belum ada kejadian.</td></tr>
          )}
        </tbody>
      </table>
      <p style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>{rows.length} kejadian ditampilkan · retensi 24 bulan</p>
    </AdminPage>
  );
}
