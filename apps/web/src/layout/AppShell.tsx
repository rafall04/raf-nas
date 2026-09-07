import { createContext, useContext, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { capabilitiesFor, Role, type Capabilities } from '@rafnas/shared';
import { useSession } from '../state/session';
import { WorkspaceProvider, useWorkspace } from '../state/workspace';
import { UploadProvider, useUpload } from '../state/uploads';
import { formatBytes } from '../data/types';
import type { SpaceDto } from '../lib/api';
import { Icon } from '../ui/icons';
import { QuotaBar } from '../ui/primitives';
import { currentTheme, toggleTheme } from '../lib/theme';
import './shell.css';

const FileRefreshContext = createContext<{ key: number; bump: () => void }>({ key: 0, bump: () => {} });
export function useFileRefresh(): { key: number; bump: () => void } {
  return useContext(FileRefreshContext);
}

function useActiveSpace(spaces: SpaceDto[]): SpaceDto | undefined {
  const loc = useLocation();
  const m = loc.pathname.match(/^\/ruang\/([^/]+)/);
  const id = m?.[1];
  return spaces.find((s) => s.id === id) ?? spaces[0];
}

function Sidebar({ spaces, active }: { spaces: SpaceDto[]; active?: SpaceDto }): JSX.Element {
  const { user, logout } = useSession();
  return (
    <aside className="sidebar">
      <div className="sb-head">
        <span className="sb-logo">RAF</span>
        <div>
          <div className="sb-name">RAF NAS</div>
          <div className="sb-host">rafnas.sfl.local</div>
        </div>
      </div>

      <div className="sb-scroll">
        <div className="sb-label">Ruang</div>
        {spaces.map((s) => (
          <NavLink key={s.id} to={`/ruang/${s.id}`} className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}>
            <Icon name="folder" size={18} />
            <span>{s.name}</span>
            <span className="sb-count tabular">{s.fileCount.toLocaleString('id-ID')}</span>
          </NavLink>
        ))}
        {spaces.length === 0 && (
          <div style={{ padding: '8px 10px', fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)' }}>Belum ada ruang yang bisa Anda akses.</div>
        )}

        <div className="sb-sep" />
        <NavLink to="/dibagikan" className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}><Icon name="share" size={18} /> <span>File dibagikan</span></NavLink>
        <NavLink to="/sampah" className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}><Icon name="trash" size={18} /> <span>Sampah</span></NavLink>

        <div className="sb-sep" />
        <NavLink to="/admin" className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}><Icon name="shield" size={18} /> <span>Admin</span></NavLink>
        <NavLink to="/state" className={({ isActive }) => `sb-item${isActive ? ' active' : ''}`}><Icon name="info" size={18} /> <span>Contoh state</span></NavLink>

        {active && (
          <div className="sb-quota">
            <div className="sb-quota-row">
              <span>Kuota {active.name}</span>
              <span className="mono">{formatBytes(active.usedBytes)} / {formatBytes(active.quotaBytes)}</span>
            </div>
            <QuotaBar used={active.usedBytes} total={active.quotaBytes} />
          </div>
        )}
      </div>

      <div className="sb-user">
        <div className="sb-user-row">
          <span className="avatar">{user?.initials ?? '?'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sb-user-name">{user?.name ?? '—'}</div>
            <div className="sb-user-sub">{user?.isSuperuser ? 'Admin IT' : 'Pengguna'}</div>
          </div>
          <button className="btn btn-ghost btn-sm" title="Keluar" onClick={() => void logout()}>Keluar</button>
        </div>
      </div>
    </aside>
  );
}

function Header({ caps, active }: { caps: Capabilities; active?: SpaceDto }): JSX.Element {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const path = sp.get('path') ?? '/';
  const { upload } = useUpload();
  const [, force] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const isDark = currentTheme() === 'dark';

  function onFiles(list: FileList | null): void {
    if (!list || !active) return;
    upload(active.id, path, Array.from(list));
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <header className="header">
      <div className="search">
        <Icon name="search" size={18} />
        <input placeholder="Cari file di semua ruang…" onKeyDown={(e) => { if (e.key === 'Enter') navigate('/cari'); }} />
      </div>
      <div className="header-spacer" />
      <button className="icon-btn" title="Ganti tema" onClick={() => { toggleTheme(); force((n) => n + 1); }}>
        <Icon name={isDark ? 'sun' : 'moon'} size={18} />
      </button>
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <button className="btn btn-primary btn-md" disabled={!caps.upload} title={caps.upload ? 'Unggah file' : 'Anda hanya punya akses baca di folder ini'} onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={18} /> Unggah
      </button>
    </header>
  );
}

function ShellInner(): JSX.Element {
  const { spaces, refresh } = useWorkspace();
  const active = useActiveSpace(spaces);
  const caps = capabilitiesFor(active?.role ?? Role.NONE);
  const [key, setKey] = useState(0);
  return (
    <FileRefreshContext.Provider value={{ key, bump: () => setKey((k) => k + 1) }}>
      <UploadProvider onComplete={() => { setKey((k) => k + 1); refresh(); }}>
        <div className="shell">
          <Sidebar spaces={spaces} active={active} />
          <div className="main">
            <Header caps={caps} active={active} />
            <div className="content">
              <Outlet />
            </div>
          </div>
        </div>
      </UploadProvider>
    </FileRefreshContext.Provider>
  );
}

export function AppShell(): JSX.Element {
  return (
    <WorkspaceProvider>
      <ShellInner />
    </WorkspaceProvider>
  );
}
