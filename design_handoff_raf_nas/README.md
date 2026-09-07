# Handoff: RAF NAS — sistem file internal PT SHOU FONG LASTINDO

## Overview

RAF NAS adalah sistem file sharing internal pabrik yang berjalan di server lokal dan diakses lewat browser. Fungsinya mirip Google Drive tapi untuk satu perusahaan manufaktur: ~70 staff produksi/QC/gudang, ~15 manager departemen, 1–2 admin IT. Konten yang disimpan: SOP, drawing teknik, laporan QC harian, form produksi, foto dokumentasi mesin, manual peralatan, dan data ekspor Excel.

Hak cipta produk: **RAF**. Pengguna: **PT SHOU FONG LASTINDO**. Host contoh di seluruh mockup: `rafnas.sfl.local` (192.168.10.4).

Bahasa antarmuka: **Bahasa Indonesia**, sentence case, kata kerja aktif.

## About the Design Files

Berkas di folder `design/` adalah **referensi desain yang dibuat dalam HTML** — prototipe yang menunjukkan tampilan dan perilaku yang dituju, **bukan kode produksi untuk dipakai langsung**.

Tugasnya adalah **membuat ulang desain ini di dalam codebase target** memakai pola dan library yang sudah ada di sana (React, Vue, Svelte, Blade, dsb). Kalau belum ada environment sama sekali, pilih framework yang paling tepat untuk konteksnya (rekomendasi: React + TypeScript + Vite untuk SPA internal, atau Next.js kalau butuh SSR) lalu implementasikan desainnya di situ.

Setiap berkas `.dc.html` adalah satu halaman mandiri yang bisa dibuka langsung di browser. Blok `<style>` di bagian atas berisi seluruh design token; markup memakai inline style; logikanya ada di `class Component` di bagian bawah berkas. Ambil **token, ukuran, hierarki, copy, dan perilakunya** — jangan meniru struktur inline-style-nya.

`support.js` adalah runtime tool desain, **bukan bagian dari produk**. Jangan diikutkan ke codebase.

## Fidelity

**High-fidelity (hifi).** Warna, tipografi, spasi, tinggi baris, dan state sudah final dan sudah diukur. Recreate pixel-perfect memakai library yang ada di codebase. Angka kontras sudah diverifikasi terhadap WCAG (lihat bagian Aksesibilitas) — jangan menurunkan nilai token tanpa mengukur ulang.

## Arah desain

Konsep: **instrumen kerja, bukan produk konsumen.** Referensi rasanya panel kontrol industri dan title block gambar teknik, tapi tetap tenang karena dipandangi 8 jam sehari.

Tiga prinsip:

1. **Kepadatan yang terbaca.** Ruang datang dari keselarasan dan hierarki tipografi, bukan padding besar.
2. **Struktur dari garis, bukan kartu.** Pemisahan pakai border tipis dan perbedaan permukaan. Tidak ada kartu melayang bertumpuk bayangan.
3. **Berani di satu tempat saja.** Kualitas produk ditentukan oleh **tabel file** (90% waktu pengguna) dan **matriks hak akses**. Sisanya sunyi dan disiplin.

### Yang harus dihindari (penolakan eksplisit)

- Latar krem hangat dengan aksen terracotta atau serif display besar
- Latar hitam pekat dengan satu aksen neon
- Semua konten dipotong jadi kartu identik dengan sudut membulat besar
- Label ALL CAPS dengan letter-spacing lebar di atas setiap judul
- Gradient sebagai dekorasi
- Emoji sebagai ikon
- Tanda `→` di akhir teks tombol
- Metadata dirangkai dengan titik tengah (`A · B · C`)
- Animasi masuk fade-and-slide saat halaman dibuka
- Ilustrasi generik "orang mengambang" di empty state

### Lingkungan pemakaian yang membentuk desain

- Monitor kantor pabrik banyak yang masih **1366×768** — desain harus lapang di lebar itu.
- Sebagian diakses dari **tablet di area produksi**, kadang oleh tangan bersarung — target sentuh besar.
- HP dipakai di lapangan untuk **memotret dan mengunggah** dokumentasi.
- Pencahayaan bervariasi (kantor terang, gudang remang) — kontras harus tinggi.
- Folder bisa berisi **5.000 file** — kepadatan informasi penting.

## Design Tokens

Semua warna adalah CSS custom property, didefinisikan tiga kali: `:root` (terang), `:root[data-theme="dark"]`, dan `@media (prefers-color-scheme:dark){:root:not([data-theme="light"])}`. **Nama token identik di kedua mode** — komponen tidak perlu tahu tema apa yang aktif. Pindahkan blok ini ke satu berkas CSS global (atau satu theme object) di codebase.

### Permukaan

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--surface` | `#FFFFFF` | `#151A21` | Konten utama, tabel file |
| `--surface-sunken` | `#F6F7F9` | `#0F141A` | Sidebar, header tabel, latar login |
| `--surface-raised` | `#FFFFFF` | `#1B2129` | Dropdown, modal, toast, panel unggah |
| `--surface-hover` | `#F0F2F5` | `#1F262F` | Baris disorot, tombol ghost aktif |
| `--surface-selected` | `#E7EFF7` | `#16303F` | Baris terpilih, ruang aktif |

### Garis

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--border` | `#DFE3E9` | `#2A313A` | Pemisah baris, border input |
| `--border-strong` | `#C3CAD4` | `#3C4653` | Pemisah struktural, tombol sekunder |
| `--border-focus` | `#1D5B8F` | `#7FB3DC` | Outline fokus keyboard |

### Teks

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--ink` | `#131820` | `#E7EBF1` | Nama file, judul, angka penting |
| `--ink-secondary` | `#59616F` | `#A4ADBA` | Metadata, header kolom, deskripsi |
| `--ink-tertiary` | `#626A77` | `#949DAB` | Metadata sekunder, placeholder, teks nonaktif |
| `--ink-inverse` | `#FFFFFF` | `#F7FAFD` | Teks di atas isian pekat |

Catatan penting: `--ink-tertiary` sudah **dinaikkan** dari nilai awal `#8B93A1` supaya lulus 4.5:1 di atas `--surface`, `--surface-sunken`, `--surface-hover`, **dan** `--surface-selected`. Jangan dikembalikan ke nilai lama.

### Primer dan tautan

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--primary` | `#1D5B8F` | `#2C74AE` | **Isian** tombol primer, bar progres, indikator terpilih |
| `--primary-hover` | `#17496F` | `#3A87C4` | Hover isian primer |
| `--primary-active` | `#123A59` | `#4A97D4` | Active isian primer |
| `--primary-subtle` | `#E7EFF7` | `#17293A` | Latar badge dan chip informasi |
| `--primary-border` | `#CBDCEB` | `#2E5474` | Border badge informasi |
| `--primary-ink` | `#144A75` | `#9BC8E8` | **Teks** di atas `--surface-selected` / `--primary-subtle` |
| `--link` | `#1D5B8F` | `#9BC8E8` | Warna `a` |
| `--link-hover` | `#17496F` | `#BBD9EE` | Warna `a:hover` |

**Kenapa `--link` terpisah dari `--primary`:** di mode gelap, satu nilai tidak bisa sekaligus lulus sebagai isian (teks putih di atasnya) dan sebagai teks (di atas permukaan gelap) — arahnya berlawanan. Jadi `--primary` untuk isian, `--link`/`--primary-ink` untuk teks. Pola yang sama berlaku untuk danger di bawah.

### Semantik

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `--success` | `#0A7040` | `#48AC7D` | Unggahan selesai, versi tersimpan (teks + ikon) |
| `--success-subtle` | `#E4F3EB` | `#12261C` | Latar badge sukses |
| `--success-border` | `#C3E3D1` | `#2C4E3A` | Border badge sukses |
| `--success-ink` | `#075430` | `#7FD0A5` | Teks di atas `--success-subtle` |
| `--warning` | `#A65B00` | `#C8892C` | Kuota 80%, file terkunci, link segera habis |
| `--warning-subtle` | `#FDF0DF` | `#28200F` | Latar banner peringatan |
| `--warning-border` | `#EBD3AE` | `#4E3E20` | Border banner peringatan |
| `--warning-ink` | `#6E3D00` | `#E8B978` | Teks di atas `--warning-subtle` |
| `--danger` | `#B3261E` | `#E4807A` | **Teks/ikon/border** danger |
| `--danger-hover` | `#96201A` | `#D4635D` | Hover teks danger |
| `--danger-solid` | `#B3261E` | `#A83A34` | **Isian** tombol danger (teks putih di atasnya) |
| `--danger-solid-hover` | `#96201A` | `#B0403A` | Hover isian tombol danger |
| `--danger-subtle` | `#FCEAE8` | `#2B1717` | Latar badge/banner danger |
| `--danger-border` | `#F0C9C5` | `#5A2E2C` | Border badge danger |
| `--danger-ink` | `#8E1E17` | `#EE9C97` | Teks di atas `--danger-subtle` |
| `--info-subtle` | `#EDF3F8` | `#16202A` | Banner netral |
| `--info-border` | `#DBE6F0` | `#27384A` | Border banner netral |

**Aturan keras: aksen amber (`--warning`) hanya untuk peringatan** — kuota hampir penuh, file terkunci, link akan kedaluwarsa. **Tidak pernah untuk aksi primer.**

### Tint baris audit

Warna redup per jenis aksi supaya audit log bisa dipindai tanpa jadi ramai.

| Token | Terang | Gelap | Jenis aksi |
|---|---|---|---|
| `--tint-danger` | `#FDF3F2` | `#211618` | Hapus, kosongkan sampah |
| `--tint-warning` | `#FEF8EE` | `#1F1B12` | Ubah hak akses, nonaktifkan pengguna |
| `--tint-info` | `#F4F8FB` | `#141D26` | Buat/cabut link berbagi |

### Ikon tipe file

Folder memakai glyph terisi netral (`--ink-secondary`) karena folder adalah struktur, bukan kategori. File memakai **chip ekstensi** — persegi kecil dengan sudut kanan atas terpotong (`clip-path: polygon(0 0, 72% 0, 100% 22%, 100% 100%, 0 100%)`), label 3 huruf mono 8px di kiri bawah. Ekstensi terbaca langsung, warna membantu memindai tanpa jadi pelangi.

| Kategori | bg terang | bd terang | ink terang | bg gelap | bd gelap | ink gelap |
|---|---|---|---|---|---|---|
| `pdf` | `#FCEAE8` | `#F0C9C5` | `#B3261E` | `#2B1717` | `#5A2E2C` | `#EE9C97` |
| `sheet` | `#E4F3EB` | `#C3E3D1` | `#0A7040` | `#12261C` | `#2C4E3A` | `#7FD0A5` |
| `doc` | `#E7EFF7` | `#CBDCEB` | `#1D5B8F` | `#17293A` | `#2E5474` | `#9BC8E8` |
| `slide` | `#FDF0DF` | `#EBD3AE` | `#A65B00` | `#28200F` | `#4E3E20` | `#E8B978` |
| `image` | `#E3F1F2` | `#BEDCDE` | `#0E6E73` | `#102528` | `#254549` | `#7FC7CE` |
| `video` | `#EDE8F6` | `#D6CBE9` | `#6D3F8C` | `#1E1930` | `#3A3055` | `#B6A0E2` |
| `zip` | `#F2EEE2` | `#DFD5BE` | `#6B5A2B` | `#221E13` | `#443C24` | `#CDBB8E` |
| `cad` | `#E9ECF7` | `#CBD2E8` | `#3A4B7A` | `#181D2C` | `#333C58` | `#A3B3DE` |
| `any` (tak dikenal) | `#F0F2F5` | `#C3CAD4` | `#626A77` | `#1F262F` | `#3C4653` | `#949DAB` |

Pemetaan ekstensi → kategori: `pdf`→pdf; `xlsx/xls/csv`→sheet; `docx/doc/txt`→doc; `pptx/ppt`→slide; `jpg/jpeg/png/gif/webp`→image; `mp4/mov/avi`→video; `zip/rar/7z`→zip; `dwg/dxf/step/iges`→cad; sisanya `any`.

### Kertas dokumen (khusus pratinjau)

Pratinjau PDF/teks/CSV memakai token terpisah yang **tetap terang di mode gelap** — dokumen kertas harus putih walau UI gelap.

`--paper:#FFFFFF`, `--paper-sunken:#F6F7F9`, `--paper-ink:#131820`, `--paper-ink-dim:#59616F`, `--paper-line:#DFE3E9`, `--paper-hover:#EDEFF3` — nilainya sama di kedua blok tema.

### Overlay

| Token | Terang | Gelap |
|---|---|---|
| `--scrim` | `rgba(19,24,32,.88)` | `rgba(6,9,13,.92)` |
| `--scrim-veil` | `rgba(19,24,32,.44)` | `rgba(6,9,13,.60)` |
| `--on-scrim` | `#EEF1F5` | `#E7EBF1` |
| `--on-scrim-dim` | `#A8B0BC` | `#98A2AF` |
| `--scrim-ctl` | `rgba(255,255,255,.10)` | `rgba(255,255,255,.08)` |
| `--scrim-line` | `rgba(255,255,255,.16)` | `rgba(255,255,255,.14)` |
| `--focus-on-scrim` | `#7FB3DC` | `#7FB3DC` |
| `--media-a` / `--media-b` | `#2A323D` / `#333C48` | `#1B2129` / `#232B34` |

`--media-a/b` dipakai untuk placeholder foto/video bergaris diagonal.

### Tipografi

`--font-ui: 'IBM Plex Sans', system-ui, sans-serif` — seluruh antarmuka.
`--font-mono: 'IBM Plex Mono', ui-monospace, monospace` — **hanya** untuk data berlebar tetap: ukuran file, path, timestamp, checksum, alamat IP, nama group, slug link. Jangan pakai mono untuk label antarmuka.

| Token | Ukuran / line-height | Pemakaian |
|---|---|---|
| `--text-xs` | 12px / 16px | Badge, caption |
| `--text-sm` | 13px / 18px | Metadata baris, header kolom |
| `--text-base` | 14px / 20px | **Ukuran kerja** — baris tabel, isi form |
| `--text-md` | 15px / 22px | Teks bacaan, penjelasan konfirmasi |
| `--text-lg` | 17px / 24px | Judul panel dan modal |
| `--text-xl` | 20px / 28px | Judul halaman |

**Berhenti di 20px.** Tidak ada teks display besar di produk ini.

Wajib: `font-variant-numeric: tabular-nums` pada **semua** angka di tabel supaya kolom ukuran file lurus.

Nama file panjang dipotong sedemikian sehingga **ekstensi tetap terlihat**. Implementasi di mockup: elemen flex dua bagian — basis nama (`min-width:0; overflow:hidden; text-overflow:ellipsis`) + ekstensi (`flex:none`), dengan nama lengkap di `title`. Contoh hasil: `Laporan-QC-Shift-Mala….xlsx`.

### Spasi, radius, elevasi

Skala spasi kelipatan 4: `4 8 12 16 20 24 32 40 48`.

`--radius-sm: 4px` (tombol, input, badge), `--radius-md: 6px` (panel, dropdown), `--radius-lg: 8px` (modal). Radius kecil dan konsisten — sudut membulat besar membaca sebagai aplikasi konsumen.

Bayangan **hanya** untuk elemen yang benar-benar melayang; elemen dalam alur halaman dipisah dengan border.

| Token | Terang | Gelap |
|---|---|---|
| `--shadow-overlay` | `0 4px 12px rgba(19,24,32,.10), 0 1px 3px rgba(19,24,32,.08)` | `0 4px 14px rgba(0,0,0,.44), 0 1px 3px rgba(0,0,0,.36)` |
| `--shadow-modal` | `0 16px 40px rgba(19,24,32,.16)` | `0 18px 44px rgba(0,0,0,.56)` |
| `--shadow-fab` | `0 6px 16px rgba(19,24,32,.22)` | `0 6px 18px rgba(0,0,0,.5)` |

### Kepadatan dan ukuran struktural

`--row-compact: 36px`, `--row-default: 44px`, `--row-touch: 56px`, `--header-height: 56px`, `--sidebar-width: 240px`, `--sidebar-rail: 56px`, `--detail-width: 320px`.

Tinggi kontrol: 32px compact / 36px default / 44px touch. Tinggi input mengikuti tinggi tombol pada kepadatan yang sama.

## Kontrak tema (light/dark)

1. Atribut `data-theme="light" | "dark"` di `<html>`.
2. Pilihan pengguna disimpan di `localStorage` kunci **`rafnas.tema`**.
3. Kalau belum ada pilihan, ikuti `prefers-color-scheme` lewat blok `@media`.
4. `color-scheme: light` / `dark` diset di masing-masing blok supaya scrollbar dan form control native ikut.
5. Tombol ganti mode tersedia di: header file browser, sidebar admin, drawer mobile, header sampah/pencarian, Login, halaman link publik.

Urutan resolusi yang dipakai di mockup: `localStorage` → `prefers-color-scheme` → terang.

## Peran dan hak akses

Empat peran, konsisten di seluruh produk:

| Peran | Boleh |
|---|---|
| **Pelihat** | Lihat dan unduh |
| **Kontributor** | + unggah (tidak bisa hapus milik orang lain) |
| **Editor** | + ganti nama, pindah, hapus |
| **Pengelola** | + atur akses di ruang itu |

Sel kosong di matriks berarti **tidak ada akses** — ditampilkan sebagai strip abu redup (`--surface-sunken`) dengan penanda `—`, bukan sel putih.

## Screens / Views

### 1. `Indeks.dc.html` — daftar isi
Halaman navigasi antar mockup. **Tidak perlu diimplementasikan** — hanya alat baca.

### 2. `Sistem Desain.dc.html` — lembar design system
Dokumentasi token, skala tipografi, dan semua komponen dalam seluruh state (normal, hover, fokus, nonaktif). **Tidak perlu diimplementasikan sebagai halaman**, tapi **inilah sumber acuan** saat membangun komponen dasar. Isinya: warna, tipografi, spasi/radius/elevasi, tombol 4 varian × 4 state × 3 ukuran, input dan kontrol, ikon tipe file dan badge, baris file, breadcrumb/toolbar/menu konteks, modal/toast/panel, empty & error state, tabel kontras terukur, dan daftar istilah baku.

### 3. `File Browser.dc.html` — halaman utama (paling penting)

**Purpose:** tempat pengguna menghabiskan 90% waktunya. Buka folder, cari file, unduh, unggah, pilih massal, lihat detail.

**Layout:** `Sidebar 240px | Main (flex:1) | Panel detail 320px`.

**Sidebar** (`--surface-sunken`, border kanan `--border-strong`):
- Header 56px: mark `RAF` 28px (`--primary`, radius sm, mono 13px), nama "RAF NAS" (600 14px), host `rafnas.sfl.local` (mono 12px `--ink-tertiary`), tombol ciut.
- Daftar **Ruang** (Produksi, QC, Gudang, Maintenance) — ikon folder + nama + jumlah file mono. Ruang aktif: `--surface-selected` + garis kiri 2px `--primary` + teks `--primary-ink`; angka jumlah juga `--primary-ink` (bukan tertiary — kontras).
- Pemisah, lalu **File pribadi / File dibagikan / Sampah**.
- Bar kuota tipis (6px, radius 3) + angka mono. Ambang: `--primary` &lt;80%, `--warning` ≥80%, `--danger` ≥95%.
- Blok pengguna: avatar inisial 26px, nama, peran di ruang aktif.
- Bisa diciutkan jadi rail ikon 56px; pilihan disimpan di `localStorage['nas.rail']`.

**Header 56px:** breadcrumb di kiri; kanan berisi pencarian, toggle kepadatan (Padat/Normal), toggle list/grid, toggle tema, toggle panel detail, tombol **Unggah** primer.
- Tombol Unggah membuka menu: Unggah file / Unggah folder / — / Folder baru.
- Kalau peran = Pelihat: tombol Unggah **tetap tampil dalam keadaan disabled** dengan tooltip "Anda hanya punya akses baca di folder ini". **Jangan disembunyikan** — menyembunyikan bikin orang mengira sistemnya rusak.
- Breadcrumb: segmen bisa diklik, segmen terakhir tebal dan tidak bisa diklik, jalur panjang diciutkan di tengah dengan menu `…`.

**Toolbar seleksi:** saat ada item terpilih, header berubah jadi `--surface-selected` menampilkan "N item dipilih" + Unduh / Pindahkan / Bagikan / Hapus + tombol kosongkan pilihan. **Tinggi tetap 56px — layout tidak boleh bergeser.**

**Tabel file** — komponen paling penting:
- Kolom: checkbox, ikon tipe, nama, ukuran, diubah, oleh, aksi cepat.
- Header kolom lengket saat scroll, bisa diklik untuk sort dengan indikator arah (caret). **Folder selalu di atas file** apa pun sortnya.
- **Wajib virtualized** — harus mulus di 5.000 baris. Mockup memakai window sederhana: tinggi baris tetap, hitung `start` dari `scrollTop`, render ~viewport+12 baris, spacer atas/bawah untuk menjaga tinggi total. Pertahankan pola ini (atau library setara).
- Klik = buka (klik ganda tidak diperlukan). Shift-klik = rentang, Ctrl/Cmd-klik = ganda.
- Baris terpilih: `--surface-selected` + **garis kiri 2px `--primary`** (supaya tetap terbaca kalau layar dilihat dari samping).
- Hover memunculkan aksi cepat di kanan (Unduh, menu tiga titik).
- Badge **Terkunci** amber + tooltip "Sedang dibuka oleh Ani W." untuk file yang sedang dibuka lewat drive jaringan. File lock sementara Office (`~$...`) **disembunyikan sepenuhnya**.
- Badge **Dibagikan** biru untuk file yang punya link aktif.
- Drag-drop unggah: seluruh area tabel diberi outline putus-putus `--primary` + teks "Lepaskan untuk mengunggah ke folder ini" + path tujuan. **Jangan ubah layout saat drag masuk.**
- Status bar bawah 30px: jumlah item, total ukuran, catatan file tersembunyi, dan info kepadatan aktif.

**Kolom adaptif — didorong lebar tabel sebenarnya, bukan lebar jendela.** Ini penting karena panel detail dan sidebar ikut memakan lebar. Ambang di mockup (lebar area scroll tabel):
- ≥820px: semua kolom
- 640–819px: kolom **Oleh** disembunyikan
- 560–639px: **Oleh** + kolom aksi disembunyikan
- 430–559px: sisa nama + ukuran
- &lt;430px: nama saja

**Tampilan grid** untuk folder berisi foto: thumbnail persegi (aspect-ratio 1), nama di bawah, ukuran mono, checkbox di pojok kiri atas. Folder di grid memakai glyph folder, bukan chip ekstensi.

**Panel detail 320px:**
- Kosong: "Pilih satu file untuk melihat metadata, akses, dan riwayat versinya."
- Satu item: pratinjau kecil (aspect 4/3, bergaris diagonal warna kategori), nama, tombol Unduh/Pratinjau/Bagikan, metadata (tipe, ukuran, diubah, oleh, **path lengkap dalam mono**), daftar **akses efektif** per group dengan badge peran, dan **tiga versi terakhir** (badge "Saat ini" pada yang teratas, tombol Pulihkan pada sisanya).
- Banyak item: jumlah, total ukuran, rincian (folder/file/terkunci), aksi massal.
- **Perilaku responsif panel detail:** inline (mengambil lebar) hanya di ≥1280px. Di bawah itu jadi **overlay dari kanan** (`position:absolute`, `min(320px, 86%)`, `--shadow-modal`, z-index 60) dengan scrim `--scrim-veil` di area konten saja — sidebar tetap terlihat. Ini mencegah kolom tabel tergerus.

**Panel unggah dan toast:** `position:fixed` kanan bawah. Kalau panel detail **inline**, keduanya bergeser ke kiri sejauh 336px supaya tidak bertumpuk. Kalau panel detail **overlay**, keduanya tetap di kanan dan panel detail berada di atasnya.

**Empty state:** "Folder ini masih kosong. Tarik file ke sini atau klik Unggah." + tombol. Kalau peran Pelihat: "Folder ini masih kosong dan Anda hanya punya akses baca. Minta akses unggah ke Admin IT." tanpa tombol.

**State lain yang harus ada:** memuat (skeleton meniru bentuk baris tabel, bukan spinner), gagal memuat (+ tombol Coba lagi), tanpa akses, kuota penuh (banner amber persisten), koneksi terputus (banner tipis 32px di atas, **bukan modal**).

**Menu konteks** (klik kanan dan tombol tiga titik memakai menu yang sama), dikelompokkan dengan pemisah: buka pratinjau / unduh — ganti nama / pindahkan / riwayat versi — buat link berbagi — pindahkan ke sampah (danger, paling bawah). Item yang butuh hak tulis jadi nonaktif untuk Pelihat, dengan catatan penjelas di bawah menu. Menu `position:fixed` dengan penjepitan tepi viewport.

### 4. `File Browser Mobile.dc.html` — HP di lapangan

**Desain ulang, bukan versi kecil.** Frame 390px (di mockup dibungkus bezel; di produksi full-bleed di bawah 440px).

- **Header 56px:** tombol kembali (atau hamburger di root) + judul folder + subjudul path mono + tombol cari + menu.
- **Drawer ruang** dari kiri (84%, maks 308px) dengan scrim; berisi ruang, rak (pribadi/dibagikan/sampah), kuota, blok pengguna, tombol tema.
- **Daftar dua baris**, tinggi minimum 64px: ikon 26px di kiri, nama di atas (15px, ekstensi selalu terlihat), ukuran + tanggal mono 12px di bawah dipisah garis vertikal 1px (**bukan titik tengah**), tombol menu 44px di kanan.
- **Mode pilih beberapa:** header berubah jadi `--surface-selected` ("N dipilih", tombol Semua), checkbox muncul di setiap baris, action bar bawah 4 tombol 48px (Unduh, Bagikan, Pindah, Hapus).
- **FAB kamera** 56px kanan bawah, `--primary`, `--shadow-fab` — **dua ketuk dari buka folder ke foto terunggah.** Ini fitur paling sering dipakai di lapangan; jangan sembunyikan di balik menu unggah. Unggah file biasa ada di menu.
- **Bottom sheet detail** (radius lg atas, maks 82% tinggi): grab handle, ikon + nama + ukuran/tanggal, 4 aksi grid 56px (Unduh, Bagikan, Versi, Hapus), lalu metadata.
- Bar unggah melayang di atas FAB; daftar diberi padding bawah 168px saat bar tampil supaya baris terakhir tidak tertutup.
- Semua target sentuh **minimal 44px**.

### 5. `Pratinjau File.dc.html` — overlay pratinjau

Latar `--scrim`, konten terpusat. Header tipis: nama file, penghitung "3 dari 24", tombol Unduh / Bagikan / Info / Tutup. Panah kiri-kanan 44px di tepi, keyboard ←/→ berpindah, Esc menutup.

Varian:
- **PDF:** halaman aspect 1/1.414 dengan `--paper`, navigasi halaman ("Halaman 3 dari 12") dan zoom (50–250%, langkah 25, tombol Sesuaikan layar).
- **Gambar:** fit-to-screen, klik untuk zoom, bisa digeser; dimensi asli ditampilkan.
- **Video:** player standar dengan bar progres dan durasi.
- **Teks dan CSV:** monospace di atas `--paper` dengan **penomoran baris**, baris header ditebalkan, info encoding/jumlah baris/pemisah di bar atas.
- **Tidak didukung** (Office, CAD, tipe tak dikenal): ikon besar, nama, ukuran, tipe, dan teks jujur "Pratinjau tidak tersedia untuk tipe file ini. Unduh lalu buka dengan aplikasi CAD di komputer Anda." + tombol Unduh. **Jangan layar kosong.**

Panel Info 320px opsional di kanan: metadata, akses efektif, riwayat versi — semuanya dengan token `--on-scrim`.

### 6. `Panel Unggah.dc.html` — spesifikasi panel unggah

Lebar 380px, kanan bawah, `--shadow-overlay`, **bertahan saat pindah halaman/folder**. Empat state + dua dialog:

1. **Berjalan:** header "Mengunggah 12 dari 40 file" + "4,2 MB/s, sisa 1,4 menit"; daftar per file (ikon, nama terpotong, bar progres 4px, status/sisa waktu, ukuran, tombol jeda); footer "Jeda semua" / "Batalkan sisanya" / "28 menunggu"; baris peringatan konflik nama.
2. **Diciutkan:** bar ringkas dengan progres total dan persen.
3. **Selesai:** header `--success-subtle` + centang, "40 file selesai diunggah", "1,8 GB dalam 6 menit 12 detik", "Panel menutup sendiri dalam 5 detik", tombol Buka folder.
4. **Ada yang gagal:** header `--danger-subtle`, "38 selesai, 2 gagal" + sebab, baris gagal dengan tombol Coba lagi, footer "Coba lagi semua". **Menetap sampai ditutup.**

**Dialog konflik nama** (modal md 560px): nama file, dua kartu berdampingan "Versi di server" vs "File yang Anda unggah" (tanggal, ukuran, oleh), checkbox "Terapkan untuk semua konflik berikutnya", tombol **Lewati file ini / Simpan keduanya / Ganti versi di server**. "Simpan keduanya" menambahkan penanda urutan sebelum ekstensi: `… (2).xlsx`.

**Banner lanjutkan unggahan:** "Ada 3 unggahan yang belum selesai dari sesi sebelumnya." + Lanjutkan / Buang. Banner tipis di atas tabel, **bukan modal**.

### 7. `Login.dc.html`

Layar penuh, kartu terpusat maks 400px, latar `--surface-sunken`. Isi: mark + nama perusahaan, judul, username, password dengan toggle lihat, checkbox "Ingat saya di komputer ini", tombol "Masuk" lebar penuh 44px, catatan bantuan, lalu baris kecil: host / IP / versi / toggle tema, dan baris hak cipta.

State (semua sudah didesain):
- **Kredensial salah** — pesan **inline merah di atas form** (bukan toast) + hint di bawah field: "Periksa huruf besar-kecil dan pastikan Caps Lock mati." + sisa percobaan.
- **Akun dinonaktifkan** — sebutkan tanggal dan siapa yang dihubungi (Admin IT ekstensi 214).
- **Terlalu banyak percobaan** — banner amber + hitung mundur, tombol nonaktif.
- **Wajib ganti kata sandi** (login pertama) — dua field + meter kekuatan + daftar syarat dengan centang.
- **Kode 2FA admin** — 6 kotak digit 52px, catatan "Kode berganti setiap 30 detik".

Layar ini dilihat 100 orang setiap pagi — buat cepat dan tidak berisik.

### 8. `Sampah Pencarian Link.dc.html` — tiga halaman

**Sampah:** tabel dengan kolom tambahan lokasi asal (ditampilkan sebagai **segmen folder terakhir**, path lengkap di `title`), dihapus oleh, dihapus kapan, dan **sisa hari sebelum terhapus permanen**. Sisa ≤3 hari ditandai amber + ikon peringatan. Banner info: "File di sampah tetap memakai kuota ruang asalnya sampai terhapus permanen." Header punya **"Kosongkan sampah"** bergaya danger dengan **konfirmasi ketik ulang** kata `HAPUS`.

**Pencarian:** hasil sebagai daftar dengan **path lengkap di bawah nama** (tanpa path, hasil pencarian tidak berguna), bagian nama yang cocok **disorot** `--highlight`, ekstensi selalu terlihat, plus ukuran/tanggal/badge ruang. Filter di kiri: ruang (checkbox + jumlah), tipe file (chip), rentang tanggal, pengunggah. Chip filter aktif di bar atas. Kosong: "Tidak ada file bernama 'xxx'. Coba kata kunci lain, kurangi filter, atau periksa ruang lain."

**File dibagikan:** daftar link milik pengguna — file/folder + slug, dibuat, kedaluwarsa, jumlah unduhan, status. Status: Aktif (hijau), Segera habis (amber, ≤3 hari), Kedaluwarsa / Batas tercapai (abu, baris diredam), Dicabut (merah). Aksi per baris: salin link, ubah, cabut.

**Dialog buat link** (modal lg 720px): pilihan izin (Lihat saja / Boleh unduh) sebagai radio card, **kedaluwarsa wajib** dengan pilihan 1/7/30/90 hari (**default 7**) dan tanggal efektif, password opsional, batas unduhan opsional. Catatan: "Setiap akses link tercatat di audit log."

**Setelah dibuat:** link dalam mono + **tombol salin besar** + ringkasan pengaturan + **QR code** (sangat membantu untuk berbagi ke HP di lapangan) + tombol Unduh QR + peringatan amber "Kirim kata sandi lewat jalur terpisah, jangan di pesan yang sama dengan link."

### 9. `Halaman Link Publik.dc.html` — dilihat penerima, tanpa login

Sengaja minimalis. **Jangan tampilkan struktur folder internal, nama ruang, atau nama pengirim.**

- **File:** ikon besar, nama, ukuran + tipe, tombol Unduh lebar penuh 52px, tanggal berlaku. Kartu maks 400px.
- **Folder:** header dengan jumlah file + total ukuran + tombol "Unduh semua", lalu daftar isi sederhana **tanpa navigasi ke atas**. Kartu maks 560px.
- **Butuh kata sandi:** ikon kunci, penjelasan, field password 48px, tombol Buka.
- **Kata sandi salah:** border danger + pesan inline.
- **Kedaluwarsa / Batas unduhan tercapai / Tidak ditemukan:** halaman utuh dengan judul, penjelasan, dan blok "Yang bisa Anda lakukan" — **bukan pesan error mentah**.

Footer: nama perusahaan + URL link + toggle tema.

### 10. `Admin.dc.html` — tujuh subhalaman

Sidebar 236px dengan tujuh item; badge amber untuk yang butuh perhatian. Header 56px: judul + subjudul + kontrol khusus halaman.

**10.1 Pengguna** — tabel: nama (avatar inisial), username mono, group (chip), terakhir masuk, status. Filter segmented (Semua/Aktif/Nonaktif) + pencarian + tombol "Tambah pengguna" primer. Baris nonaktif diredam **tapi tetap terbaca** (`--surface-sunken`, ikon status). Aksi per baris: Ubah, Reset sandi, menu. **Tidak ada tombol hapus** — hanya nonaktifkan, supaya audit log tetap punya rujukan; ini **dijelaskan di footer halaman**. Modal tambah/ubah (md): nama, username, kata sandi awal + tombol Buat acak, checkbox wajib ganti kata sandi, multi-select group dengan deskripsi.

**10.2 Group** — daftar kiri (nama mono, jumlah anggota, jumlah ruang) + panel detail kanan 340px: nama, deskripsi, pencarian tambah anggota, daftar anggota dengan tombol keluarkan.

**10.3 Ruang penyimpanan** — satu baris per ruang: nama + deskripsi, bar kuota + angka (amber 80%, merah 95%) + teks peringatan, jumlah file, kebijakan snapshot, chip group yang punya akses, tombol Ubah ruang. Tombol "Buat ruang" primer. Form buat ruang: nama, deskripsi, kuota, preset snapshot (Standar / Retensi panjang / Minimal), group awal beserta perannya.

**10.4 Hak akses — halaman terpenting di area admin.**
- **Matriks group × ruang** (6 group × 5 ruang di mockup). Kolom pertama 200px **sticky** (nama group mono + jumlah anggota); header baris **sticky** dengan latar opaque; scroll dua arah.
- Setiap sel adalah tombol yang membuka **dropdown peran**. Sel berisi menampilkan nama peran + chevron; **sel kosong menampilkan `—` terpusat tanpa chevron** di atas strip `--surface-sunken` — supaya matriks tidak jadi ladang chevron.
- **Dropdown wajib dirender di lapisan `position:fixed` di akar komponen, bukan di dalam sel.** Wadah matriks `overflow:auto` akan memotongnya. Ambil `getBoundingClientRect()` tombol sel, simpan `{x, y}` di state, lalu **jepit** `x = min(x, innerWidth - menuWidth - 8)` dan **balik ke atas** bila `rect.bottom + menuHeight > innerHeight`. Tutup pada klik luar, Esc, resize, dan scroll. (Ini bug nyata yang sudah diperbaiki di mockup — jangan diulang.)
- Dropdown menampilkan konteks di kepalanya: nama group + "di ruang X", lalu lima opsi dengan centang pada yang aktif.
- **Perubahan tidak langsung tersimpan.** Sel yang berubah diberi **titik amber 7px** di pojok kanan atas, dan muncul bar bawah: "N perubahan belum disimpan" + rincian + tombol **Batalkan perubahan** / **Simpan perubahan**. Kesalahan permission itu mahal — beri kesempatan meninjau.
- Legenda peran di bar atas memakai **chip dengan styling identik dengan sel**, supaya jadi kunci baca, bukan kontrol.
- Di bawah matriks: section **terlipat** "Pengecualian per folder" (path mono, group, peran, hapus) — sengaja dibuat tidak menonjol supaya orang memakai matriks sebagai jalur utama. Ditutup dengan empat kartu definisi peran.

**10.5 Audit** — tabel padat (baris 36px): waktu mono, pengguna mono, aksi dengan titik warna + tint baris redup per jenis, objek mono, alamat IP. Filter rentang tanggal + jenis aksi. Tombol **"Ekspor CSV" menonjol** — ini akan sering diminta mendadak. **Baris bisa diklik** untuk membuka detail: dua kartu Sebelum / Sesudah (data mentah mono) + catatan penjelas — khususnya untuk perubahan permission. Footer: jumlah kejadian, retensi 24 bulan.

**10.6 Link aktif** — semua link share di seluruh sistem: file + path, pembuat, kedaluwarsa, jumlah akses, status, tombol Cabut. Checkbox untuk **cabut massal** (tombol di header, nonaktif saat belum ada pilihan). Footer menjelaskan kenapa halaman ini ada: "Tanpa halaman ini, dalam setahun akan ada puluhan link terbuka tanpa ada yang tahu."

**10.7 Sistem** — ringkasan kesehatan sebagai **daftar terstruktur dengan angka besar di kolom kanan**, **bukan dashboard penuh gauge dan grafik** — halaman ini dibuka saat ada masalah, harus langsung terbaca. Isi: kapasitas pool dengan bar + sisa + pemakaian snapshot, kapasitas per ruang, lalu daftar: jumlah snapshot, snapshot terbaru, status backup terakhir, sesi aktif, unggahan berjalan, suhu disk tertinggi, disk dengan peringatan, error terakhir. Titik hijau/amber per baris. Banner amber di atas untuk catatan backup.

### 11. `State dan Error.dc.html` — kumpulan state

Referensi untuk state yang **wajib ada di setiap halaman**: memuat (skeleton), kosong, tidak ada hasil (beda dari kosong), tanpa akses, error, koneksi terputus, kuota penuh, akses baca saja. Plus tabel **nada penulisan** Pakai vs Hindari.

## Interactions & Behavior

- **Transisi 120–180ms, hanya sebagai respons aksi pengguna** (menu membuka, panel menggeser, baris terpilih). **Tanpa animasi masuk saat halaman dimuat.**
- Hormati `prefers-reduced-motion` — mockup mematikan seluruh transisi dan animasi.
- **Keyboard di tabel file:** ↑↓ berpindah baris (dengan auto-scroll), Home/End, PageUp/PageDown, Enter buka folder atau pratinjau, Space pilih/lepas, Shift+↑↓ pilih rentang, Delete pindahkan ke sampah, Esc tutup menu/panel/modal.
- **Fokus keyboard** terlihat jelas di semua elemen interaktif: `outline: 2px solid var(--border-focus); outline-offset: 2px`. **Jangan pernah `outline: none` tanpa pengganti.**
- **Modal:** tiga ukuran (sm 400px konfirmasi, md 560px form, lg 720px permission/share). Selalu ada tombol tutup, Esc menutup, **fokus terjebak di dalam dan dikembalikan saat ditutup**.
- **Toast:** kanan bawah, di atas panel unggah. Sukses hilang otomatis **4 detik**; error **menetap sampai ditutup**. Sertakan **Urungkan** bila memungkinkan.
- **Konfirmasi menjelaskan akibat, bukan bertanya kosong.** "Hapus 12 file ke sampah? Bisa dipulihkan dalam 30 hari." bukan "Anda yakin?"
- Semua ikon punya label aksesibel (`aria-label` / `aria-hidden` sesuai peran).
- **Jangan pernah pakai warna sebagai satu-satunya penanda status** — selalu ada ikon atau teks pendamping.

## State Management

Yang perlu ada (nama di mockup dalam tanda kurung):

**File browser:** ruang aktif + rak (`space`, `view`), path folder (`path`), kata kunci (`q`), sort `{key, dir}`, seleksi (`sel[]`, `anchor`, `active`, `hover`), window virtualisasi (`start`, `viewH`), lebar container dan lebar tabel (`w`, `tw`), sidebar ciut (`rail`), panel detail (`detail`), kepadatan (`dense`), tampilan list/grid (`mode`), menu konteks (`menu {r, x, y}`), menu unggah, drag aktif, panel unggah (ciut/tutup), toast.

**Admin:** subhalaman aktif, pencarian + filter pengguna, group terpilih, **sel matriks terbuka (`cellOpen` key `"group|colIndex"`) + posisi menu (`cellMenu {group, space, x, y}`)**, **perubahan permission belum disimpan (`changes` map key→peran)**, section pengecualian terlipat, baris audit terbuka, seleksi link, modal pengguna.

**Persisten (localStorage):** `rafnas.tema` (light/dark), `nas.dense` (Padat/Normal), `nas.rail` (0/1), `nas.detail` (0/1).

**Data fetching yang dibutuhkan backend:** daftar isi folder (paginated/streamed — folder bisa 5.000 item), metadata file + akses efektif + riwayat versi, kuota per ruang, hasil pencarian dengan path, isi sampah dengan sisa hari, daftar link share, matriks group×ruang, audit log dengan filter + ekspor CSV, ringkasan kesehatan sistem, status lock file (siapa yang sedang membuka).

## Aksesibilitas — sudah diukur, jangan diturunkan

Kontras teks minimal **4.5:1**, teks besar 3:1. Seluruh mockup sudah diaudit dengan formula WCAG terhadap latar yang benar-benar ter-resolve, di **kedua mode**, dan hasilnya **0 pelanggaran**.

Nilai terukur di atas `--surface` (mode terang): `--ink` 17,8:1 · `--primary` 7,1:1 · `--danger` 6,5:1 · `--ink-secondary` 6,2:1 · `--success` 6,2:1 · `--warning` 5,1:1 · `--ink-tertiary` 5,5:1. Ambang terendah adalah `--ink-tertiary` pada **4,7:1** di atas `--surface-selected`. Di mode gelap seluruh pasangan berada di **5,0:1 atau lebih tinggi**.

Tiga jebakan yang sudah diselesaikan dan perlu dipertahankan:
1. `--ink-tertiary` harus lulus di **empat** permukaan (surface, sunken, hover, selected), bukan hanya putih.
2. Angka/label di atas `--surface-selected` memakai `--primary-ink`, bukan `--ink-tertiary`.
3. Isian pekat butuh token sendiri (`--danger-solid`, `--primary`) yang terpisah dari versi teks (`--danger`, `--link`) — di mode gelap satu nilai tidak bisa memenuhi keduanya.

## Copywriting

Bahasa Indonesia, sentence case, kata kerja aktif. Tombol menyebut apa yang terjadi: "Simpan perubahan", bukan "Kirim". Nama aksi konsisten sepanjang alur — tombol "Bagikan" menghasilkan toast "Link dibagikan".

Nada: jelaskan keadaan lalu langkah berikutnya. **Jangan minta maaf, jangan menyalahkan pengguna, jangan pakai istilah teknis.**

| Pakai | Hindari |
|---|---|
| Gagal memuat daftar file. Periksa koneksi lalu coba lagi. | Error 500: Internal Server Error |
| Hapus 12 file ke sampah? Bisa dipulihkan dalam 30 hari. | Anda yakin? |
| Anda hanya punya akses baca di folder ini. | Akses ditolak (403) |
| Kuota Ruang Gudang penuh. Hubungi Admin IT untuk menambah kuota. | Maaf, terjadi kesalahan. Silakan coba beberapa saat lagi. |
| Nama folder tidak boleh memakai tanda garis miring. | Input tidak valid |

**Istilah baku, konsisten di seluruh produk:** Ruang, Folder, File, Pelihat, Kontributor, Editor, Pengelola, Sampah, Link berbagi, Riwayat versi.

## Responsif

| Lebar | Perilaku |
|---|---|
| **≥1440px** | Sidebar terbuka, panel detail terbuka inline, semua kolom tampil |
| **1280–1439px** | Panel detail masih inline; panel unggah bergeser 336px |
| **1024–1279px** | **Target utama.** Sidebar terbuka, panel detail **overlay** dan default tertutup |
| **768–1023px** | Sidebar jadi rail ikon atau drawer, baris naik ke 56px, toggle kepadatan disembunyikan (otomatis Sentuh), kolom "Oleh" hilang, target sentuh ≥44px |
| **&lt;768px** | Pakai desain mobile (berkas terpisah): drawer, daftar dua baris, bottom sheet, FAB kamera |

Kolom tabel dipilih dari **lebar area tabel sebenarnya** (lihat ambang di bagian File Browser), bukan dari lebar jendela — ini yang membuat kombinasi sidebar + panel detail tidak pernah menggerus kolom.

**Halaman admin:** matriks permission **tidak dipaksakan ke HP**. Tampilkan daftar per ruang atau arahkan ke layar lebih besar dengan penjelasan.

## Assets

Tidak ada aset biner. Semua ikon adalah **SVG inline stroke-based** (`stroke-width` 1.4–2.2, `stroke-linecap/linejoin: round`, viewBox 24×24, warna `currentColor` atau token). Ganti dengan set ikon yang sudah ada di codebase (Lucide/Feather punya bobot yang sangat mirip) — jangan salin SVG dari mockup satu per satu.

Font: **IBM Plex Sans** dan **IBM Plex Mono** dari Google Fonts (bobot 400/500/600/700 untuk Sans, 400/500 untuk Mono). Dipilih karena dirancang untuk perangkat lunak teknis, sangat terbaca di ukuran kecil dan padat, punya angka tabular, dan cocok dengan konteks industri. Di produksi sebaiknya di-self-host.

Placeholder gambar/video: gradien bergaris diagonal dari token kategori atau `--media-a/b` + label mono. QR code di dialog share adalah **grid placeholder** — ganti dengan generator QR asli.

## Files

Semua di folder `design/`:

| Berkas | Isi |
|---|---|
| `Indeks.dc.html` | Daftar isi seluruh mockup (alat baca, bukan halaman produk) |
| `Sistem Desain.dc.html` | **Acuan utama** — token, tipografi, semua komponen × semua state |
| `File Browser.dc.html` | Halaman utama: tabel virtualized, sidebar, panel detail, panel unggah, menu konteks |
| `File Browser Mobile.dc.html` | Desain HP: drawer, daftar dua baris, bottom sheet, FAB kamera |
| `Pratinjau File.dc.html` | Overlay pratinjau: PDF, gambar, video, teks/CSV, tipe tak didukung |
| `Panel Unggah.dc.html` | Panel unggah 4 state + dialog konflik nama + banner lanjutkan |
| `Login.dc.html` | Login + 5 state error/khusus |
| `Sampah Pencarian Link.dc.html` | Sampah, Pencarian, File dibagikan + dialog buat link + QR |
| `Halaman Link Publik.dc.html` | Halaman penerima link, 7 state |
| `Admin.dc.html` | 7 subhalaman admin termasuk matriks hak akses |
| `State dan Error.dc.html` | Kumpulan state wajib + panduan nada tulisan |
| `support.js` | Runtime alat desain — **jangan diikutkan ke codebase** |

Cara membaca satu berkas: buka di browser untuk melihat hasilnya, lalu baca sumbernya — blok `<style>` (token), markup (`<sc-if>` = kondisional, `<sc-for>` = perulangan, `{{ x }}` = nilai dari logika), dan `class Component` di bawah (state, handler, data contoh). Panel Tweaks di alat desain memetakan ke props di `data-props` JSON pada tag `<script>` — itu **saklar demo untuk berpindah state**, bukan fitur produk.

## Prioritas implementasi

Kalau harus memilih di mana mencurahkan waktu paling banyak: **tabel file** dan **matriks hak akses**. Yang pertama menentukan pengalaman harian 100 orang; yang kedua menentukan apakah sistemnya bisa dikelola dengan benar.

Urutan yang disarankan:
1. Token + tema (light/dark) + tipografi + komponen dasar (tombol, input, badge, chip tipe file)
2. Shell aplikasi: sidebar, header, breadcrumb, toolbar seleksi
3. Tabel file virtualized + seleksi + keyboard + menu konteks
4. Panel detail, pratinjau, panel unggah
5. Login, Sampah, Pencarian, File dibagikan, halaman link publik
6. Admin — matriks hak akses paling akhir tapi paling teliti
7. Sapu semua state: memuat, kosong, tidak ada hasil, tanpa akses, error, koneksi terputus, kuota penuh
