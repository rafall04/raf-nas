import { useFetch } from '../../lib/useFetch';
import { fetchAdminSpaces } from '../../lib/api';
import { Button, QuotaBar } from '../../ui/primitives';
import { Icon } from '../../ui/icons';
import { formatBytes } from '../../data/types';
import { AdminPage } from './AdminPage';

export function Spaces(): JSX.Element {
  const state = useFetch(fetchAdminSpaces);
  const rows = state.data ?? [];
  return (
    <AdminPage
      title="Ruang penyimpanan"
      subtitle="Tiap ruang punya kuota dan kebijakan snapshot sendiri."
      state={state}
      actions={<Button variant="primary" size="md"><Icon name="plus" size={16} /> Buat ruang</Button>}
    >
      <table className="adm-table">
        <thead><tr><th>Ruang</th><th style={{ width: 260 }}>Kuota</th><th>Group berakses</th><th></th></tr></thead>
        <tbody>
          {rows.map((s) => {
            const pct = s.quotaBytes > 0 ? Math.round((s.usedBytes / s.quotaBytes) * 100) : 0;
            return (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginBottom: 4 }}>
                    <span className="mono">{formatBytes(s.usedBytes)} / {formatBytes(s.quotaBytes)}</span>
                    <span className="mono">{pct}%</span>
                  </div>
                  <QuotaBar used={s.usedBytes} total={s.quotaBytes} />
                </td>
                <td className="mono">{s.groups} group</td>
                <td style={{ textAlign: 'right' }}><Button variant="ghost" size="sm">Ubah ruang</Button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </AdminPage>
  );
}
