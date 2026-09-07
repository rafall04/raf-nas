import type { Role } from '@rafnas/shared';

export type Category =
  | 'pdf'
  | 'sheet'
  | 'doc'
  | 'slide'
  | 'image'
  | 'video'
  | 'zip'
  | 'cad'
  | 'any';

export interface Space {
  id: string;
  name: string;
  usedBytes: number;
  quotaBytes: number;
  fileCount: number;
}

export interface FileNode {
  id: string;
  name: string;
  ext?: string;
  isFolder: boolean;
  sizeBytes: number;
  updatedAt: string; // ISO
  updatedBy: string;
  itemCount?: number; // untuk folder
  lockedBy?: string | null;
  shared?: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  initials: string;
  isSuperuser: boolean;
}

/** Preview role yang bisa diganti dari UI untuk mengecek perilaku per peran. */
export type PreviewRole = Role;

export const CATEGORY_BY_EXT: Record<string, Category> = {
  pdf: 'pdf',
  xlsx: 'sheet',
  xls: 'sheet',
  csv: 'sheet',
  docx: 'doc',
  doc: 'doc',
  txt: 'doc',
  pptx: 'slide',
  ppt: 'slide',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  zip: 'zip',
  rar: 'zip',
  '7z': 'zip',
  dwg: 'cad',
  dxf: 'cad',
  step: 'cad',
  iges: 'cad',
};

export function categoryOf(ext?: string): Category {
  if (!ext) return 'any';
  return CATEGORY_BY_EXT[ext.toLowerCase()] ?? 'any';
}

export function formatBytes(n: number): string {
  if (n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
