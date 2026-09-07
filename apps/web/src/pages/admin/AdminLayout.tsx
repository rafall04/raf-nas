import { NavLink, Outlet } from 'react-router-dom';
import './admin.css';

const NAV: { to: string; label: string; attention?: boolean }[] = [
  { to: '/admin/pengguna', label: 'Pengguna' },
  { to: '/admin/group', label: 'Group' },
  { to: '/admin/ruang', label: 'Ruang penyimpanan' },
  { to: '/admin/hak-akses', label: 'Hak akses' },
  { to: '/admin/audit', label: 'Audit' },
  { to: '/admin/link', label: 'Link aktif' },
  { to: '/admin/sistem', label: 'Sistem', attention: true },
];

export function AdminLayout(): JSX.Element {
  return (
    <div className="admin">
      <nav className="admin-nav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>{n.label}</span>
            {n.attention && <span className="att" title="Butuh perhatian" />}
          </NavLink>
        ))}
      </nav>
      <div className="admin-body">
        <Outlet />
      </div>
    </div>
  );
}
