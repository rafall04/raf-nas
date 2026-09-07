import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

const QUIET = 4; // zona hening (modul) sesuai spesifikasi QR agar dapat dipindai

function build(value: string) {
  const qr = qrcode(0, 'M'); // versi otomatis, koreksi galat sedang
  qr.addData(value);
  qr.make();
  return qr;
}

/** QR asli (dapat dipindai) sebagai SVG. */
export function QRCode({ value, size = 140 }: { value: string; size?: number }): JSX.Element {
  const { count, darks } = useMemo(() => {
    const qr = build(value);
    const c = qr.getModuleCount();
    const d: [number, number][] = [];
    for (let r = 0; r < c; r++) for (let col = 0; col < c; col++) if (qr.isDark(r, col)) d.push([r, col]);
    return { count: c, darks: d };
  }, [value]);

  const total = count + QUIET * 2;
  const cell = size / total;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Kode QR link">
      <rect x={0} y={0} width={size} height={size} fill="#fff" />
      <g fill="#131820">
        {darks.map(([r, c]) => (
          <rect key={`${r}-${c}`} x={(c + QUIET) * cell} y={(r + QUIET) * cell} width={cell} height={cell} />
        ))}
      </g>
    </svg>
  );
}

/** Hasilkan PNG data URL dari QR untuk diunduh. */
export function qrPngDataUrl(value: string, px = 512): string {
  const qr = build(value);
  const count = qr.getModuleCount();
  const total = count + QUIET * 2;
  const cell = Math.max(1, Math.floor(px / total));
  const dim = cell * total;
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = '#131820';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + QUIET) * cell, (r + QUIET) * cell, cell, cell);
    }
  }
  return canvas.toDataURL('image/png');
}
