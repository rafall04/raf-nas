import { useFetch } from '../../lib/useFetch';
import { fetchSystem } from '../../lib/api';
import { formatBytes } from '../../data/types';
import { AdminPage } from './AdminPage';

export function SystemHealth(): JSX.Element {
  const state = useFetch(fetchSystem);
  const sys = state.data;
  const pct = sys && sys.poolTotal > 0 ? Math.round((sys.poolUsed / sys.poolTotal) * 100) : 0;

  return (
    <AdminPage
      title="Sistem"
      subtitle="Ringkasan kesehatan. Metrik penyimpanan & akun dihitung langsung dari server; snapshot/backup/SMART menyusul setelah integrasi Windows."
      state={state}
    >
      {sys && (
        <>
          <div className="health-cap">
            <div className="health-cap-row">
              <span style={{ fontWeight: 600 }}>Kapasitas pool</span>
              <span className="mono">{formatBytes(sys.poolUsed)} / {formatBytes(sys.poolTotal)} ({pct}%)</span>
            </div>
            <div className="quota-track">
              <div className={`quota-fill ${pct >= 95 ? 'quota-danger' : pct >= 80 ? 'quota-warning' : 'quota-primary'}`} style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
          </div>

          <div className="health-list">
            {sys.rows.map((r) => (
              <div className="health-row" key={r.label}>
                <span className={`health-dot ${r.ok ? 'ok' : 'warn'}`} />
                <span className="health-label">{r.label}</span>
                <span className="health-value">{r.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminPage>
  );
}
