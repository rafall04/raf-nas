# RAF NAS

Sistem file-sharing internal pabrik — produk **RAF** untuk **PT Shou Fong Lastindo**.
Web-only, berjalan di satu server Windows Server 2019, aplikasi = sumber kebenaran.

> Desain referensi (hi-fi) ada di [`design_handoff_raf_nas/`](design_handoff_raf_nas/).
> Analisa & keputusan arsitektur pra-build: `rafnas-analisa-prabuild.html`.

## Arsitektur

| Lapis | Teknologi | Catatan |
|---|---|---|
| Frontend | React + TypeScript + Vite | `apps/web` |
| Backend | NestJS (Node) | `apps/api`, listen `127.0.0.1:4000` |
| Database | PostgreSQL | skema di `apps/api/prisma/schema.prisma` |
| Bersama | TypeScript | `packages/shared` — peran & mesin hak akses |

## Struktur

```
apps/
  web/       React + Vite (SPA)
  api/       NestJS API (bind localhost:4000)
packages/
  shared/    peran, kapabilitas, resolusi hak akses efektif (+ test)
```

## Menjalankan (dev)

```bash
npm install                # install semua workspace
npm run build:shared       # build paket shared sekali
npm run dev:api            # API di http://127.0.0.1:4000/api
npm run dev:web            # web di http://localhost:5173 (proxy /api -> 4000)
npm test                   # unit test mesin hak akses
```

Cek API hidup: `GET http://127.0.0.1:4000/api/health`.

## Rencana port produksi (192.168.101.100 — sudah dicek bebas)

| Komponen | Port | Bind |
|---|---|---|
| HTTPS publik (reverse proxy) | 443 | `0.0.0.0` (kedua LAN) |
| HTTP redirect | 80 | `0.0.0.0` |
| NestJS API | 4000 | `127.0.0.1` |
| PostgreSQL | 5432 | `127.0.0.1` |

## Status

Milestone 1 (fondasi) — scaffold berjalan, mesin hak akses + skema data siap.
Berikutnya: wiring PostgreSQL/Prisma, autentikasi akun lokal (argon2id), lalu tabel file.
