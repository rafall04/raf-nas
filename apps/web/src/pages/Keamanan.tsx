import { useState } from 'react';
import { disable2fa, enroll2fa, verify2fa } from '../lib/api';
import { useSession } from '../state/session';
import { useToast } from '../state/toasts';
import { Badge, Button } from '../ui/primitives';
import { Icon } from '../ui/icons';
import './pages.css';

export function Keamanan(): JSX.Element {
  const { user, refresh } = useSession();
  const { notify } = useToast();
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const enabled = user?.twoFactorEnabled;

  async function start(): Promise<void> {
    setBusy(true);
    try {
      const r = await enroll2fa();
      setSecret(r.secret);
    } finally {
      setBusy(false);
    }
  }
  async function confirm(): Promise<void> {
    setBusy(true);
    try {
      await verify2fa(code.trim());
      await refresh();
      setSecret(null);
      setCode('');
      notify('2FA diaktifkan.', { tone: 'success' });
    } catch {
      notify('Kode salah, coba lagi.', { tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }
  async function off(): Promise<void> {
    setBusy(true);
    try {
      await disable2fa();
      await refresh();
      notify('2FA dimatikan.', { tone: 'success' });
    } finally {
      setBusy(false);
    }
  }

  const box: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 18,
    maxWidth: 520,
    background: 'var(--surface-raised)',
  };
  const inp: React.CSSProperties = {
    height: 40,
    padding: '0 12px',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-base)',
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Keamanan</h1>
          <p>Autentikasi dua langkah (2FA) dengan aplikasi authenticator: Google Authenticator, Authy, dsb.</p>
        </div>
      </div>
      <div className="page-body">
        <div style={box}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Icon name="shield" size={20} />
            <strong>Autentikasi dua langkah</strong>
            {enabled ? <Badge tone="success">Aktif</Badge> : <Badge tone="info">Nonaktif</Badge>}
          </div>

          {enabled ? (
            <>
              <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>
                Akun Anda diminta kode 6 digit setiap login. Matikan hanya bila perlu.
              </p>
              <Button variant="danger" disabled={busy} onClick={() => void off()}>Matikan 2FA</Button>
            </>
          ) : !secret ? (
            <>
              <p style={{ margin: '0 0 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>
                Tambahkan lapisan keamanan: kode berganti tiap 30 detik dari aplikasi authenticator.
              </p>
              <Button variant="primary" disabled={busy} onClick={() => void start()}>Aktifkan 2FA</Button>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>
                1. Masukkan kunci ini ke aplikasi authenticator Anda (entri manual):
              </p>
              <div className="mono" style={{ padding: '10px 12px', background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all', marginBottom: 14 }}>{secret}</div>
              <p style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>2. Masukkan 6 digit kode untuk verifikasi:</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input style={{ ...inp, flex: 1 }} inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
                <Button variant="primary" disabled={busy || code.trim().length < 6} onClick={() => void confirm()}>Verifikasi</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
