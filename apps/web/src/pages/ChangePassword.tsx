import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { changePasswordApi } from '../lib/api';
import { useSession } from '../state/session';
import './Login.css';

export function ChangePassword(): JSX.Element {
  const { authed, user, refresh } = useSession();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (authed === false) return <Navigate to="/login" replace />;

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) {
      setErr('Kata sandi minimal 8 karakter.');
      return;
    }
    if (pw !== pw2) {
      setErr('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setBusy(true);
    try {
      await changePasswordApi(pw);
      await refresh();
      navigate('/', { replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Gagal mengganti kata sandi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark">
          <span className="login-logo">RAF</span>
          <span className="login-company">PT Shou Fong Lastindo</span>
        </div>
        <h1 className="login-title">Ganti kata sandi</h1>
        <p className="login-sub">
          {user?.mustChangePassword ? 'Login pertama — buat kata sandi baru sebelum melanjutkan.' : 'Perbarui kata sandi akun Anda.'}
        </p>

        {err && <div className="login-error" role="alert">{err}</div>}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="pw">Kata sandi baru</label>
            <div className="input-wrap">
              <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pw2">Ulangi kata sandi baru</label>
            <div className="input-wrap">
              <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
          </div>
          <p className="help" style={{ margin: '0 0 14px' }}>Minimal 8 karakter. Gunakan kombinasi huruf, angka, dan simbol.</p>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kata sandi'}</button>
        </form>
      </div>
    </div>
  );
}
