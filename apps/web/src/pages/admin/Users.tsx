import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { fetchAdminUsers } from '../../lib/api';
import { Button } from '../../ui/primitives';
import { Icon } from '../../ui/icons';
import { AdminPage } from './AdminPage';

type Filter = 'all' | 'active' | 'inactive';

export function Users(): JSX.Element {
  const state = useFetch(fetchAdminUsers);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  const rows = (state.data ?? []).filter((u) => {
    if (filter === 'active' && !u.active) return false;
    if (filter === 'inactive' && u.active) return false;
    if (q && !`${u.name} ${u.username}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminPage
      title="Pengguna"
      subtitle="Kelola akun. Pengguna dinonaktifkan, bukan dihapus — agar audit log tetap punya rujukan."
      state={state}
      actions={<Button variant="primary" size="md"><Icon name="plus" size={16} /> Tambah pengguna</Button>}
    >
      <div className="adm-toolbar">
        <div className="search" style={{ maxWidth: 280, flex: 'none' }}>
          <Icon name="search" size={16} />
          <input placeholder="Cari nama / username…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="sp" />
        {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
          <Button key={f} variant={filter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
          </Button>
        ))}
      </div>

      <table className="adm-table">
        <thead>
          <tr><th>Nama</th><th>Username</th><th>Group</th><th>Terakhir masuk</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className={u.active ? '' : 'row-off'}>
              <td>
                <span className="name-cell">
                  <span className="avatar-sm">{u.initials}</span>
                  {u.name}
                  {u.isSuperuser && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--primary-ink)' }}>Admin IT</span>}
                </span>
              </td>
              <td className="mono">{u.username}</td>
              <td>{u.groups.length ? u.groups.map((g) => <span className="chip-group" key={g}>{g}</span>) : <span style={{ color: 'var(--ink-tertiary)' }}>—</span>}</td>
              <td className="mono">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('id-ID') : '—'}</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.active ? 'var(--success)' : 'var(--ink-tertiary)' }} />
                  {u.active ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}><Button variant="ghost" size="sm">Ubah</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>
        Tidak ada tombol hapus — pengguna hanya bisa dinonaktifkan agar jejak audit tetap utuh.
      </p>
    </AdminPage>
  );
}
