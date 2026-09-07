const MAP: Record<string, string> = {
  pdf: 'pdf',
  xlsx: 'sheet', xls: 'sheet', csv: 'sheet',
  docx: 'doc', doc: 'doc', txt: 'doc',
  pptx: 'slide', ppt: 'slide',
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  mp4: 'video', mov: 'video', avi: 'video',
  zip: 'zip', rar: 'zip', '7z': 'zip',
  dwg: 'cad', dxf: 'cad', step: 'cad', iges: 'cad',
};

export function extOf(filename: string): string | undefined {
  const i = filename.lastIndexOf('.');
  return i >= 0 && i < filename.length - 1 ? filename.slice(i + 1).toLowerCase() : undefined;
}

export function categoryOf(ext?: string): string {
  if (!ext) return 'any';
  return MAP[ext.toLowerCase()] ?? 'any';
}

/** Normalisasi path logis + BUANG segmen '.' dan '..' agar tak bisa keluar dari root. */
export function normalizePath(p: string): string {
  const segs = p
    .split('/')
    .filter(Boolean)
    .filter((s) => s !== '.' && s !== '..');
  return '/' + segs.join('/');
}

/**
 * Ambil nama file/berkas aman: basename saja, tanpa pemisah path atau '..'.
 * Melempar bila hasilnya kosong atau berbahaya.
 */
export function sanitizeFileName(name: string): string {
  const clean = (name ?? '').replace(/\\/g, '/').split('/').pop()?.trim() ?? '';
  if (!clean || clean === '.' || clean === '..') return '';
  return clean;
}

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  txt: 'text/plain; charset=utf-8', csv: 'text/plain; charset=utf-8',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
};

export function mimeOf(ext?: string | null): string {
  if (!ext) return 'application/octet-stream';
  return MIME[ext.toLowerCase()] ?? 'application/octet-stream';
}
