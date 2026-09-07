import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { QRCode, qrPngDataUrl } from '../ui/QRCode';
import { createShareLink, type CreatedLinkDto } from '../lib/api';
import './createlink.css';

const EXPIRY = [1, 7, 30, 90];

export function CreateLinkDialog({
  nodeId,
  fileName,
  onClose,
}: {
  nodeId: string;
  fileName: string;
  onClose: () => void;
}): JSX.Element {
  const [step, setStep] = useState<'config' | 'done'>('config');
  const [expiry, setExpiry] = useState(7);
  const [password, setPassword] = useState('');
  const [limit, setLimit] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedLinkDto | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl = created ? `${window.location.origin}/l/${created.slug}` : '';

  async function submit(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await createShareLink(nodeId, {
        expiryDays: expiry,
        password: password || undefined,
        downloadLimit: limit ? Number(limit) : undefined,
      });
      setCreated(res);
      setStep('done');
    } catch {
      setError('Gagal membuat link.');
    } finally {
      setBusy(false);
    }
  }

  function copy(): void {
    void navigator.clipboard?.writeText(publicUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadQr(): void {
    if (!publicUrl) return;
    const url = qrPngDataUrl(publicUrl, 512);
    if (!url) return;
    const safe = (fileName || 'link').replace(/[^\w.-]+/g, '_').slice(0, 40);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${safe}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (step === 'config') {
    return (
      <Modal
        size="lg"
        title={`Buat link berbagi — ${fileName}`}
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Batal</Button>
            <Button variant="primary" onClick={() => void submit()} disabled={busy}>{busy ? 'Membuat…' : 'Buat link'}</Button>
          </>
        }
      >
        {error && <div className="cl-warn" style={{ marginTop: 0, marginBottom: 12 }}>{error}</div>}
        <div className="cl-label">Kedaluwarsa</div>
        <div className="expiry-row">
          {EXPIRY.map((d) => (
            <Button key={d} size="sm" variant={expiry === d ? 'primary' : 'secondary'} onClick={() => setExpiry(d)}>{d} hari</Button>
          ))}
        </div>

        <div className="cl-grid">
          <div>
            <div className="cl-label">Kata sandi (opsional)</div>
            <input className="cl-input" type="text" placeholder="Kosongkan bila tanpa sandi" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <div className="cl-label">Batas unduhan (opsional)</div>
            <input className="cl-input" type="number" min={1} placeholder="Tak terbatas" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
        </div>
        <p className="cl-note">Setiap akses link tercatat di audit log.</p>
      </Modal>
    );
  }

  return (
    <Modal size="lg" title="Link siap dibagikan" onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Selesai</Button>}>
      <div className="done-grid">
        <div>
          <div className="cl-label">Link</div>
          <div className="link-row">
            <span className="link-url mono">{publicUrl}</span>
            <Button size="sm" variant="secondary" onClick={copy}><Icon name="check" size={16} /> {copied ? 'Tersalin' : 'Salin'}</Button>
          </div>

          <div className="cl-label">Pengaturan</div>
          <ul className="settings">
            <li><span>Kedaluwarsa</span><b>{expiry} hari</b></li>
            <li><span>Kata sandi</span><b>{password ? 'Ya' : 'Tidak'}</b></li>
            <li><span>Batas unduhan</span><b>{limit || 'Tak terbatas'}</b></li>
          </ul>

          {password && (
            <div className="cl-warn"><Icon name="lock" size={16} /> Kirim kata sandi lewat jalur terpisah — jangan di pesan yang sama dengan link.</div>
          )}
        </div>

        <div className="qr-box">
          <QRCode value={publicUrl} size={140} />
          <Button size="sm" variant="ghost" onClick={downloadQr}><Icon name="download" size={16} /> Unduh QR</Button>
          <span className="qr-cap">Pindai untuk berbagi ke HP di lapangan.</span>
        </div>
      </div>
    </Modal>
  );
}
