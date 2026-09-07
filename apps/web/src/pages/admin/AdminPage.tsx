import type { ReactNode } from 'react';

interface State {
  loading: boolean;
  forbidden: boolean;
  error: boolean;
}

export function AdminNotice({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div
      style={{
        margin: '20px 24px',
        padding: '14px 16px',
        fontSize: 'var(--text-sm)',
        color: 'var(--ink-secondary)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {children}
    </div>
  );
}

export function AdminPage({
  title,
  subtitle,
  actions,
  state,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  state: State;
  children: ReactNode;
}): JSX.Element {
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {actions}
      </div>
      {state.loading ? (
        <AdminNotice>Memuat…</AdminNotice>
      ) : state.forbidden ? (
        <AdminNotice>Hanya Admin IT yang bisa membuka halaman ini. Masuk sebagai <b>admin.it</b>.</AdminNotice>
      ) : state.error ? (
        <AdminNotice>Gagal memuat data. Coba muat ulang halaman.</AdminNotice>
      ) : (
        <div className="adm-content">{children}</div>
      )}
    </>
  );
}
