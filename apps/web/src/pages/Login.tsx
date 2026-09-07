import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentTheme, toggleTheme, type Theme } from '../lib/theme';
import { getHealth } from '../lib/api';
import { useSession } from '../state/session';
import './Login.css';

type ApiState = 'checking' | 'ok' | 'error';

export function Login(): JSX.Element {
  const { login, authed } = useSession();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [remember, setRemember] = useState(false); // default OFF — PC dipakai bergantian
  const [theme, setTheme] = useState<Theme>(currentTheme());
  const [api, setApi] = useState<ApiState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getHealth()
      .then(() => alive && setApi('ok'))
      .catch(() => alive && setApi('error'));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (authed === true) navigate('/', { replace: true });
  }, [authed, navigate]);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  function onToggleTheme(): void {
    setTheme(toggleTheme());
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark">
          <span className="login-logo">RAF</span>
          <span className="login-company">PT Shou Fong Lastindo</span>
        </div>

        <h1 className="login-title">Masuk ke RAF NAS</h1>
        <p className="login-sub">Sistem file internal — akses dengan akun Anda.</p>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Nama pengguna</label>
            <div className="input-wrap">
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Kata sandi</label>
            <div className="input-wrap">
              <input
                id="password"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="reveal"
                aria-pressed={reveal}
                onClick={() => setReveal((v) => !v)}
              >
                {reveal ? 'Sembunyikan' : 'Lihat'}
              </button>
            </div>
          </div>

          <label className="remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Ingat saya di komputer ini
          </label>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Masuk…' : 'Masuk'}
          </button>
        </form>

        <p className="help">Lupa kata sandi? Hubungi Admin IT (ekstensi 214).</p>

        <div className="login-meta">
          <span className="mono">rafnas.sfl.local · v0.1</span>
          <span
            className={`api-dot ${api === 'ok' ? 'ok' : api === 'error' ? 'err' : ''}`}
            title="Status koneksi ke API"
          >
            <span className="dot" />
            {api === 'checking' ? 'cek API…' : api === 'ok' ? 'API terhubung' : 'API mati'}
          </span>
          <button type="button" className="theme-btn" onClick={onToggleTheme}>
            {theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          </button>
        </div>
      </div>
    </div>
  );
}
