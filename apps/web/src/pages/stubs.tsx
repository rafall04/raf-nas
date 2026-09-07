import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../ui/primitives';
import { Icon } from '../ui/icons';
import './stubs.css';

function StateCard({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="state-card">
      <div className="state-card-title">{title}</div>
      <div className="state-card-body">{children}</div>
    </div>
  );
}

export function StatesGallery(): JSX.Element {
  return (
    <div className="ph">
      <div className="ph-inner" style={{ maxWidth: 860 }}>
        <h1 className="ph-title">Contoh state</h1>
        <p className="ph-sub">
          State wajib di setiap halaman. Sudah aktif di produk: baca-saja + tombol nonaktif (lihat File
          Browser sebagai Pelihat), kuota berambang warna, konfirmasi ketik ulang (Sampah).
        </p>

        <div className="state-grid">
          <StateCard title="Memuat — skeleton">
            <div className="sk-rows">
              {[70, 88, 60, 80].map((w, i) => (
                <div className="sk-row" key={i}>
                  <span className="sk sk-chip" />
                  <span className="sk" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </StateCard>

          <StateCard title="Kosong">
            <div className="state-empty">
              <p className="state-empty-t">Folder ini masih kosong.</p>
              <p className="state-empty-d">Tarik file ke sini atau klik Unggah.</p>
            </div>
          </StateCard>

          <StateCard title="Tidak ada hasil">
            <div className="state-empty">
              <p className="state-empty-t">Tidak ada file bernama “xyz”.</p>
              <p className="state-empty-d">Coba kata kunci lain atau kurangi filter.</p>
            </div>
          </StateCard>

          <StateCard title="Error">
            <div className="state-empty">
              <p className="state-empty-t">Gagal memuat daftar file.</p>
              <p className="state-empty-d">Periksa koneksi lalu coba lagi. <span className="mono">(LS-503)</span></p>
              <Button size="sm" variant="secondary" style={{ marginTop: 8 }}>Coba lagi</Button>
            </div>
          </StateCard>

          <StateCard title="Koneksi terputus">
            <div className="mini-banner off">
              <Icon name="info" size={15} /> Koneksi terputus — mencoba ulang 8 detik…
            </div>
          </StateCard>

          <StateCard title="Kuota penuh">
            <div className="mini-banner danger">
              <Icon name="info" size={15} /> Kuota Ruang Gudang penuh. Hubungi Admin IT.
            </div>
          </StateCard>

          <StateCard title="Akses baca saja">
            <div className="mini-banner info">
              <Icon name="info" size={15} /> Anda hanya punya akses baca di folder ini.
            </div>
          </StateCard>

          <StateCard title="Kuota hampir penuh">
            <div className="mini-banner warn">
              <Icon name="info" size={15} /> Kuota Ruang QC 88% — mendekati batas.
            </div>
          </StateCard>
        </div>

        <div className="ph-label" style={{ marginTop: 24 }}>Overlay &amp; tampilan lain</div>
        <div className="state-links">
          <NavLink to="/pratinjau">Pratinjau File</NavLink>
          <NavLink to="/unggah">Panel Unggah</NavLink>
          <NavLink to="/mobile">Tampilan Mobile</NavLink>
        </div>
      </div>
    </div>
  );
}
