import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button, FileTypeChip } from '../ui/primitives';
import { Icon } from '../ui/icons';
import './upload.css';

type UState = 'running' | 'collapsed' | 'done' | 'failed';

const RUNNING = [
  { name: 'Foto-Mesin-Bubut-03.jpg', ext: 'jpg', pct: 72, size: '3,2 MB' },
  { name: 'Laporan-QC-Shift-Malam.xlsx', ext: 'xlsx', pct: 45, size: '1,1 MB' },
  { name: 'SOP-Pengelasan-Rev4.pdf', ext: 'pdf', pct: 18, size: '2,4 MB' },
];

const STATES: { id: UState; label: string }[] = [
  { id: 'running', label: 'Berjalan' },
  { id: 'collapsed', label: 'Diciutkan' },
  { id: 'done', label: 'Selesai' },
  { id: 'failed', label: 'Ada yang gagal' },
];

export function UploadDemo(): JSX.Element {
  const [state, setState] = useState<UState>('running');
  const [conflict, setConflict] = useState(false);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Panel unggah</h1>
          <p>Bertahan saat pindah folder. Empat state di kanan bawah — ganti untuk melihat semuanya.</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {STATES.map((s) => (
            <Button key={s.id} size="sm" variant={state === s.id ? 'primary' : 'secondary'} onClick={() => setState(s.id)}>
              {s.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setConflict(true)}>Dialog konflik nama</Button>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', maxWidth: '60ch' }}>
          Panel muncul di kanan bawah. "Simpan keduanya" menambahkan penanda urutan sebelum ekstensi:
          <span className="mono"> … (2).xlsx</span>.
        </p>
      </div>

      <div className="upl-panel">
        {state === 'collapsed' ? (
          <div className="upl-collapsed">
            <div className="upl-bar" style={{ flex: 1, marginTop: 0 }}><span style={{ width: '62%' }} /></div>
            <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>62%</span>
            <button className="act"><Icon name="chevron-down" size={16} className="flip-up" /></button>
          </div>
        ) : state === 'done' ? (
          <>
            <div className="upl-head success">
              <Icon name="check" size={18} />
              <div>
                <div className="upl-title">40 file selesai diunggah</div>
                <div className="upl-sub">1,8 GB dalam 6 menit 12 detik · panel menutup sendiri dalam 5 detik</div>
              </div>
            </div>
            <div className="upl-foot"><span className="sp" style={{ flex: 1 }} /><Button size="sm" variant="secondary">Buka folder</Button></div>
          </>
        ) : state === 'failed' ? (
          <>
            <div className="upl-head danger">
              <Icon name="info" size={18} />
              <div>
                <div className="upl-title">38 selesai, 2 gagal</div>
                <div className="upl-sub">Sebagian file melebihi batas ukuran.</div>
              </div>
            </div>
            <div className="upl-list">
              {['Video-Kalibrasi-Sensor.mp4', 'Backup-Data-Ekspor.zip'].map((n) => (
                <div className="upl-file" key={n}>
                  <FileTypeChip ext={n.split('.').pop()} />
                  <div className="upl-file-main">
                    <div className="upl-file-name">{n}</div>
                    <div className="upl-sub" style={{ color: 'var(--danger-ink)' }}>Gagal — melebihi batas</div>
                  </div>
                  <Button size="sm" variant="ghost">Coba lagi</Button>
                </div>
              ))}
            </div>
            <div className="upl-foot"><span style={{ flex: 1 }} /><Button size="sm" variant="secondary">Coba lagi semua</Button></div>
          </>
        ) : (
          <>
            <div className="upl-head">
              <div style={{ flex: 1 }}>
                <div className="upl-title">Mengunggah 12 dari 40 file</div>
                <div className="upl-sub">4,2 MB/s · sisa 1,4 menit</div>
              </div>
              <button className="act"><Icon name="chevron-down" size={16} /></button>
            </div>
            <div className="upl-list">
              {RUNNING.map((f) => (
                <div className="upl-file" key={f.name}>
                  <FileTypeChip ext={f.ext} />
                  <div className="upl-file-main">
                    <div className="upl-file-name">{f.name}</div>
                    <div className="upl-bar"><span style={{ width: `${f.pct}%` }} /></div>
                  </div>
                  <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)' }}>{f.size}</span>
                </div>
              ))}
            </div>
            <div className="upl-foot">
              <Button size="sm" variant="ghost">Jeda semua</Button>
              <Button size="sm" variant="ghost">Batalkan sisanya</Button>
              <span style={{ flex: 1 }} />
              <span>28 menunggu</span>
            </div>
          </>
        )}
      </div>

      {conflict && (
        <Modal
          size="md"
          title="Nama file sudah ada"
          onClose={() => setConflict(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConflict(false)}>Lewati file ini</Button>
              <Button variant="secondary" onClick={() => setConflict(false)}>Simpan keduanya</Button>
              <Button variant="primary" onClick={() => setConflict(false)}>Ganti versi di server</Button>
            </>
          }
        >
          <p style={{ margin: '0 0 16px', fontSize: 'var(--text-base)', color: 'var(--ink-secondary)' }}>
            <b style={{ color: 'var(--ink)' }}>Laporan-QC-Shift-Malam.xlsx</b> sudah ada di folder ini.
          </p>
          <div className="conflict-cards">
            <div className="conflict-card">
              <div className="cc-label">Versi di server</div>
              <div className="cc-meta">1,0 MB · oleh budi.s</div>
              <div className="cc-meta">5 Sep 2026</div>
            </div>
            <div className="conflict-card">
              <div className="cc-label">File yang Anda unggah</div>
              <div className="cc-meta">1,1 MB · oleh Anda</div>
              <div className="cc-meta">Hari ini</div>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>
            <input type="checkbox" /> Terapkan untuk semua konflik berikutnya
          </label>
        </Modal>
      )}
    </div>
  );
}
