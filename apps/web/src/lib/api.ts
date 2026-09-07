import type { Capabilities, Role } from '@rafnas/shared';

export interface HealthResponse {
  status: string;
  service: string;
  time: string;
}

export interface PublicUser {
  id: string;
  username: string;
  name: string;
  initials: string;
  isSuperuser: boolean;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
}

export interface LoginErrorBody {
  message?: string;
  twoFactorRequired?: boolean;
  remaining?: number;
  retryAfter?: number;
}
export class LoginError extends Error {
  constructor(public status: number, public body: LoginErrorBody) {
    super(body.message ?? 'Gagal masuk.');
  }
}

export interface SpaceDto {
  id: string;
  name: string;
  role: Role;
  quotaBytes: number;
  usedBytes: number;
  fileCount: number;
}

export interface NodeDto {
  id: string;
  name: string;
  ext: string | null;
  isFolder: boolean;
  category: string;
  path: string;
  sizeBytes: number;
  updatedAt: string;
  updatedBy: string;
  itemCount?: number;
  shared: boolean;
  lockedBy: string | null;
}

export interface NodesResponse {
  role: Role;
  caps: Capabilities;
  nodes: NodeDto[];
}

export interface MatrixDto {
  groups: { id: string; name: string; members: number }[];
  spaces: { id: string; name: string }[];
  grants: Record<string, string>;
}

export interface AdminUserDto {
  id: string;
  name: string;
  username: string;
  initials: string;
  groups: string[];
  active: boolean;
  isSuperuser: boolean;
  lastLogin: string | null;
}

export interface AdminGroupDto {
  id: string;
  name: string;
  members: number;
  spaces: number;
}

export interface AdminSpaceDto {
  id: string;
  name: string;
  quotaBytes: number;
  usedBytes: number;
  groups: number;
}

export interface AuditDto {
  time: string;
  user: string;
  action: string;
  object: string;
  ip: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as T;
}

export class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

export async function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>('/api/health');
}

export async function apiLogin(username: string, password: string, code?: string): Promise<PublicUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, code }),
  });
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as LoginErrorBody;
    throw new LoginError(res.status, b);
  }
  return (await res.json()) as PublicUser;
}

export async function changePasswordApi(oldPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(b.message ?? 'Gagal mengganti kata sandi.');
  }
}

export async function enroll2fa(): Promise<{ secret: string; otpauth: string }> {
  const res = await fetch('/api/auth/2fa/enroll', { method: 'POST' });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as { secret: string; otpauth: string };
}
export async function verify2fa(code: string): Promise<void> {
  const res = await fetch('/api/auth/2fa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
  if (!res.ok) throw new Error('Kode salah.');
}
export async function disable2fa(): Promise<void> {
  const res = await fetch('/api/auth/2fa/disable', { method: 'POST' });
  if (!res.ok) throw new HttpError(res.status);
}

export async function apiLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function apiMe(): Promise<PublicUser> {
  return getJson<PublicUser>('/api/auth/me');
}

export async function fetchSpaces(): Promise<SpaceDto[]> {
  return getJson<SpaceDto[]>('/api/spaces');
}

export async function fetchNodes(spaceId: string, path = '/'): Promise<NodesResponse> {
  return getJson<NodesResponse>(`/api/spaces/${spaceId}/nodes?path=${encodeURIComponent(path)}`);
}

export async function fetchMatrix(): Promise<MatrixDto> {
  return getJson<MatrixDto>('/api/admin/matrix');
}

export async function saveMatrix(changes: Record<string, string>): Promise<{ ok: boolean; count: number }> {
  const res = await fetch('/api/admin/matrix', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes }),
  });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as { ok: boolean; count: number };
}

export async function fetchAdminUsers(): Promise<AdminUserDto[]> {
  return getJson<AdminUserDto[]>('/api/admin/users');
}

export async function fetchAdminGroups(): Promise<AdminGroupDto[]> {
  return getJson<AdminGroupDto[]>('/api/admin/groups');
}

export async function fetchAdminSpaces(): Promise<AdminSpaceDto[]> {
  return getJson<AdminSpaceDto[]>('/api/admin/spaces');
}

export async function fetchAudit(): Promise<AuditDto[]> {
  return getJson<AuditDto[]>('/api/admin/audit');
}

export interface SystemDto {
  poolUsed: number;
  poolTotal: number;
  rows: { label: string; value: string; ok: boolean }[];
}
export async function fetchSystem(): Promise<SystemDto> {
  return getJson<SystemDto>('/api/admin/system');
}

export function downloadNodeUrl(id: string): string {
  return `/api/nodes/${id}/download`;
}

export function nodeContentUrl(id: string): string {
  return `/api/nodes/${id}/content`;
}

export async function trashNode(id: string): Promise<void> {
  const res = await fetch(`/api/nodes/${id}/trash`, { method: 'POST' });
  if (!res.ok) throw new HttpError(res.status);
}

export async function renameNode(id: string, name: string): Promise<NodeDto> {
  const res = await fetch(`/api/nodes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as NodeDto;
}

export interface VersionDto {
  id: string;
  sizeBytes: number;
  createdAt: string;
  by: string;
  isCurrent: boolean;
}
export async function fetchVersions(nodeId: string): Promise<VersionDto[]> {
  return getJson<VersionDto[]>(`/api/nodes/${nodeId}/versions`);
}
export async function restoreVersion(nodeId: string, versionId: string): Promise<void> {
  const res = await fetch(`/api/nodes/${nodeId}/versions/${versionId}/restore`, { method: 'POST' });
  if (!res.ok) throw new HttpError(res.status);
}

export async function createFolderApi(spaceId: string, name: string, path = '/'): Promise<NodeDto> {
  const res = await fetch(`/api/spaces/${spaceId}/folders?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as NodeDto;
}

export interface SearchResultDto {
  id: string;
  name: string;
  ext: string | null;
  category: string;
  sizeBytes: number;
  updatedAt: string;
  spaceId: string;
  spaceName: string;
  path: string;
}
export interface SearchResponse {
  spaces: { id: string; name: string }[];
  results: SearchResultDto[];
}

export async function searchApi(q: string, space?: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q });
  if (space) params.set('space', space);
  return getJson<SearchResponse>(`/api/search?${params.toString()}`);
}

export interface TrashItemDto {
  id: string;
  name: string;
  ext: string | null;
  category: string;
  isFolder: boolean;
  space: string;
  originName: string;
  originPath: string;
  by: string;
  trashedAt: string;
  daysLeft: number;
}

export async function fetchTrash(): Promise<TrashItemDto[]> {
  return getJson<TrashItemDto[]>('/api/trash');
}

export async function restoreNode(id: string): Promise<void> {
  const res = await fetch(`/api/nodes/${id}/restore`, { method: 'POST' });
  if (!res.ok) throw new HttpError(res.status);
}

export async function emptyTrash(): Promise<{ count: number }> {
  const res = await fetch('/api/trash/empty', { method: 'POST' });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as { count: number };
}

export type LinkStatus = 'ACTIVE' | 'SOON' | 'EXPIRED' | 'LIMIT_REACHED' | 'REVOKED';

export interface MyLinkDto {
  id: string;
  slug: string;
  file: string;
  created: string;
  expires: string;
  hits: number;
  hasPassword: boolean;
  status: LinkStatus;
}

export interface CreatedLinkDto {
  slug: string;
  url: string;
  expiresAt: string;
}

export async function createShareLink(
  nodeId: string,
  opts: { expiryDays?: number; password?: string; downloadLimit?: number },
): Promise<CreatedLinkDto> {
  const res = await fetch(`/api/nodes/${nodeId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as CreatedLinkDto;
}

export async function fetchShareLinks(): Promise<MyLinkDto[]> {
  return getJson<MyLinkDto[]>('/api/sharelinks');
}

export async function revokeShareLink(id: string): Promise<void> {
  const res = await fetch(`/api/sharelinks/${id}/revoke`, { method: 'POST' });
  if (!res.ok) throw new HttpError(res.status);
}

export interface PublicMetaDto {
  status: LinkStatus;
  name?: string;
  ext?: string | null;
  sizeBytes?: number;
  needsPassword?: boolean;
  expiresAt?: string;
}

export async function publicMeta(slug: string): Promise<PublicMetaDto> {
  const res = await fetch(`/api/public/${slug}`);
  if (res.status === 404) return { status: 'REVOKED' };
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as PublicMetaDto;
}

/** Verifikasi sandi (bila ada) dan dapatkan token unduh sekali-pakai. Sandi TIDAK masuk URL. */
export async function publicVerify(slug: string, password?: string): Promise<string> {
  const res = await fetch(`/api/public/${slug}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(b.message ?? (res.status === 429 ? 'Terlalu banyak percobaan. Coba lagi sebentar.' : 'Kata sandi salah.'));
  }
  return ((await res.json()) as { token: string }).token;
}

export function publicDownloadUrl(slug: string, token: string): string {
  return `/api/public/${slug}/download?token=${encodeURIComponent(token)}`;
}
