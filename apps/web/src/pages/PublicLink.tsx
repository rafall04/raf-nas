import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicDownloadUrl, publicMeta, type PublicMetaDto } from '../lib/api';
import { formatBytes } from '../data/types';
import { Button, FileTypeChip } from '../ui/primitives';
import { Icon } from '../ui/icons';

const wrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
  background: 'var(--surface-sunken)',
  padding: 24,
};
const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-overlay)',
  padding: 28,
  textAlign: 'center',
};

const BLOCKED: Record<string, { title: string; desc: string }> = {
  EXPIRED: { title: 'Link kedaluwarsa', desc: 'Masa berlaku link ini sudah habis. Minta pengirim membuat link baru.' },
  REVOKED: { title: 'Link tidak ditemukan', desc: 'Link ini sudah dicabut atau tidak pernah ada.' },
  LIMIT_REACHED: { title: 'Batas unduhan tercapai', desc: 'Link ini sudah mencapai batas jumlah unduhan.' },
};

export function PublicLink(): JSX.Element {
  const { slug = '' } = useParams();
  const [meta, setMeta] = useState<PublicMetaDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    let alive = true;
    publicMeta(slug)
      .then((m) => alive && (setMeta(m), setLoading(false)))
      .catch(() => alive && (setMeta({ status: 'REVOKED' }), setLoading(false)));
    return () => {
      alive = false;
    };
  }, [slug]);

  function dl(): void {
    const a = document.createElement('a');
    a.href = publicDownloadUrl(slug, meta?.needsPassword ? password : undefined);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (loading) {
    return <div style={wrap}><div style={{ color: 'var(--ink-tertiary)', fontFamily: 'var(--font-ui)' }}>Memuat…</div></div>;
  }

  const status = meta?.status ?? 'REVOKED';
  const blocked = BLOCKED[status];
  if (blocked) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: 'var(--ink-tertiary)' }}><Icon name="info" size={40} /></div>
          <h1 style={{ margin: '0 0 6px', fontSize: 'var(--text-lg)', fontWeight: 600 }}>{blocked.title}</h1>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>{blocked.desc}</p>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>rafnas.sfl.local/l/{slug}</p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ transform: 'scale(1.8)' }}><FileTypeChip ext={meta?.ext ?? undefined} /></div>
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 'var(--text-lg)', fontWeight: 600, wordBreak: 'break-word' }}>{meta?.name}</h1>
        <p style={{ margin: '0 0 20px', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>
          {meta?.sizeBytes != null ? formatBytes(meta.sizeBytes) : ''}
          {meta?.expiresAt ? ` · berlaku sampai ${new Date(meta.expiresAt).toLocaleDateString('id-ID')}` : ''}
        </p>

        {meta?.needsPassword && (
          <div style={{ marginBottom: 14, textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', marginBottom: 6 }}>Kata sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}
              placeholder="Masukkan kata sandi dari pengirim"
            />
          </div>
        )}

        <Button variant="primary" size="lg" style={{ width: '100%' }} disabled={meta?.needsPassword && !password} onClick={dl}>
          <Icon name="download" size={18} /> Unduh
        </Button>
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>rafnas.sfl.local/l/{slug}</p>
    </div>
  );
}
