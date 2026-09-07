import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './state/session';
import { AppShell } from './layout/AppShell';
import { FileBrowser } from './pages/FileBrowser';
import { Login } from './pages/Login';
import { PublicLink } from './pages/PublicLink';
import { Trash } from './pages/Trash';
import { SearchPage } from './pages/Search';
import { Shared } from './pages/Shared';
import { StatesGallery } from './pages/stubs';
import { Preview } from './pages/Preview';
import { UploadDemo } from './pages/UploadDemo';
import { Mobile } from './pages/Mobile';
import { ChangePassword } from './pages/ChangePassword';
import { Keamanan } from './pages/Keamanan';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Users } from './pages/admin/Users';
import { Groups } from './pages/admin/Groups';
import { Spaces } from './pages/admin/Spaces';
import { PermissionMatrix } from './pages/admin/PermissionMatrix';
import { Audit } from './pages/admin/Audit';
import { ActiveLinks } from './pages/admin/ActiveLinks';
import { SystemHealth } from './pages/admin/SystemHealth';

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const { authed, user } = useSession();
  if (authed === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink-tertiary)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-sm)',
        }}
      >
        Memuat…
      </div>
    );
  }
  if (!authed) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/ganti-sandi" replace />;
  return children;
}

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/ganti-sandi" element={<ChangePassword />} />
        <Route path="/l/:slug" element={<PublicLink />} />
        <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<FileBrowser />} />
          <Route path="ruang/:spaceId" element={<FileBrowser />} />
          <Route path="sampah" element={<Trash />} />
          <Route path="cari" element={<SearchPage />} />
          <Route path="dibagikan" element={<Shared />} />
          <Route path="unggah" element={<UploadDemo />} />
          <Route path="keamanan" element={<Keamanan />} />
          <Route path="state" element={<StatesGallery />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/pengguna" replace />} />
            <Route path="pengguna" element={<Users />} />
            <Route path="group" element={<Groups />} />
            <Route path="ruang" element={<Spaces />} />
            <Route path="hak-akses" element={<PermissionMatrix />} />
            <Route path="audit" element={<Audit />} />
            <Route path="link" element={<ActiveLinks />} />
            <Route path="sistem" element={<SystemHealth />} />
          </Route>
        </Route>
        <Route path="/pratinjau" element={<Preview />} />
        <Route path="/mobile" element={<Mobile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
