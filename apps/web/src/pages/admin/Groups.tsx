import { useFetch } from '../../lib/useFetch';
import { fetchAdminGroups } from '../../lib/api';
import { Button } from '../../ui/primitives';
import { Icon } from '../../ui/icons';
import { AdminPage } from './AdminPage';

export function Groups(): JSX.Element {
  const state = useFetch(fetchAdminGroups);
  const rows = state.data ?? [];
  return (
    <AdminPage
      title="Group"
      subtitle="Group mengelompokkan pengguna. Hak akses diberikan ke group, bukan ke perorangan."
      state={state}
      actions={<Button variant="primary" size="md"><Icon name="plus" size={16} /> Buat group</Button>}
    >
      <table className="adm-table">
        <thead><tr><th>Nama group</th><th>Anggota</th><th>Ruang berakses</th><th></th></tr></thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id}>
              <td className="mono">{g.name}</td>
              <td className="mono">{g.members}</td>
              <td className="mono">{g.spaces}</td>
              <td style={{ textAlign: 'right' }}><Button variant="ghost" size="sm">Kelola anggota</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminPage>
  );
}
