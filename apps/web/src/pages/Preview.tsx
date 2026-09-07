import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { nodeContentUrl } from '../lib/api';
import { Icon } from '../ui/icons';
import './preview.css';

type Variant = 'pdf' | 'image' | 'video' | 'text' | 'unsupported';

const TABS: { id: Variant; label: string }[] = [
  { id: 'pdf', label: 'PDF' },
  { id: 'image', label: 'Gambar' },
  { id: 'video', label: 'Video' },
  { id: 'text', label: 'Teks / CSV' },
  { id: 'unsupported', label: 'Tak didukung' },
];

function variantFor(ext: string, cat: string): Variant {
  if (cat === 'image') return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt' || ext === 'csv') return 'text';
  if (cat === 'video') return 'video';
  return 'unsupported';
}

export function Preview(): JSX.Element {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const node = params.get('node');
  const name = params.get('name') ?? 'File';
  const ext = (params.get('ext') ?? '').toLowerCase();
  const cat = params.get('cat') ?? 'any';

  const [text, setText] = useState<string | null>(null);
  const [demo, setDemo] = useState<Variant>('pdf');
  const v = node ? variantFor(ext, cat) : demo;

  useEffect(() => {
    if (node && v === 'text') {
      fetch(nodeContentUrl(node))
        .then((r) => r.text())
        .then(setText)
        .catch(() => setText('(gagal memuat isi file)'));
    }
  }, [node, v]);

  const contentUrl = node ? nodeContentUrl(node) : '';

  return (
    <div className="preview">
      <div className="pv-top">
        <span className="pv-name">{name}</span>
        {!node && <span className="pv-count">contoh</span>}
        <span className="pv-spacer" />
        {node && v !== 'unsupported' && (
          <a className="pv-btn" href={`/api/nodes/${node}/download`}><Icon name="download" size={18} /> Unduh</a>
        )}
        <button className="pv-btn" onClick={() => navigate('/')}><Icon name="close" size={18} /></button>
      </div>

      <div className="pv-stage">
        {/* ---- Mode nyata (dari File Browser) ---- */}
        {node && v === 'image' && <img src={contentUrl} alt={name} style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 6 }} />}
        {node && v === 'pdf' && <iframe title={name} src={contentUrl} style={{ width: 'min(720px,90vw)', height: '78vh', border: 'none', borderRadius: 6, background: '#fff' }} />}
        {node && v === 'text' && (
          <div className="pv-text" style={{ whiteSpace: 'pre-wrap' }}>
            {(text ?? 'Memuat…').split('\n').map((line, i) => (
              <div className="pv-text-row" key={i}><span className="pv-ln">{i + 1}</span><span className="pv-code">{line}</span></div>
            ))}
          </div>
        )}
        {node && (v === 'unsupported' || v === 'video') && (
          <div className="pv-unsupported">
            <div className="pv-big-icon"><Icon name="file" size={40} /></div>
            <div className="pv-us-name">{name}</div>
            <div className="pv-us-meta">{ext.toUpperCase()}</div>
            <p className="pv-us-text">Pratinjau tidak tersedia untuk tipe file ini. Unduh lalu buka dengan aplikasi yang sesuai di komputer Anda.</p>
            <a className="pv-btn solid" href={`/api/nodes/${node}/download`}><Icon name="download" size={18} /> Unduh</a>
          </div>
        )}

        {/* ---- Mode demo (tanpa node): peraga varian ---- */}
        {!node && demo === 'pdf' && (
          <div className="pv-pdf"><div className="pv-paper-head">Halaman 3 dari 12</div><div className="pv-lines">{Array.from({ length: 14 }, (_, i) => <span key={i} className="pv-line" style={{ width: `${55 + ((i * 37) % 45)}%` }} />)}</div></div>
        )}
        {!node && demo === 'image' && <div className="pv-media"><span className="pv-dim">3024 × 4032</span></div>}
        {!node && demo === 'video' && <div className="pv-video"><div className="pv-play"><Icon name="chevron-right" size={28} /></div><div className="pv-progress"><span style={{ width: '38%' }} /></div></div>}
        {!node && demo === 'text' && <div className="pv-text">{['tanggal,shift,reject', '2026-09-01,Malam,12', '2026-09-02,Pagi,8'].map((l, i) => <div className="pv-text-row" key={i}><span className="pv-ln">{i + 1}</span><span className={i === 0 ? 'pv-code head' : 'pv-code'}>{l}</span></div>)}</div>}
        {!node && demo === 'unsupported' && <div className="pv-unsupported"><div className="pv-big-icon"><Icon name="file" size={40} /></div><div className="pv-us-name">Drawing-Rangka-A12.dwg</div><div className="pv-us-meta">CAD</div><p className="pv-us-text">Pratinjau tidak tersedia untuk tipe file ini.</p></div>}
      </div>

      {!node && (
        <div className="pv-switch">
          {TABS.map((t) => <button key={t.id} className={`pv-tab${demo === t.id ? ' active' : ''}`} onClick={() => setDemo(t.id)}>{t.label}</button>)}
        </div>
      )}
    </div>
  );
}
