import { Role, ROLE_RANK } from './roles';

/** Grant peran sebuah group pada sebuah ruang (satu sel matriks). */
export interface SpaceGrant {
  groupId: string;
  spaceId: string;
  role: Role;
}

/** Pengecualian per-folder. role = NONE berarti "Tidak ada akses" (deny). */
export interface FolderException {
  /** Ruang tempat pengecualian ini berlaku — pengecualian TIDAK lintas ruang. */
  spaceId: string;
  /** path folder relatif dari root ruang, mis. "/QC/Laporan". Root = "/". */
  folderPath: string;
  groupId: string;
  role: Role;
}

export interface ResolveInput {
  userGroupIds: string[];
  spaceId: string;
  /** path folder/file target relatif dari root ruang, mis. "/Laporan/Shift-A". */
  targetPath: string;
  grants: SpaceGrant[];
  exceptions: FolderException[];
  /** Admin IT / superuser mem-bypass matriks. */
  isSuperuser?: boolean;
}

function normalize(p: string): string {
  return '/' + p.split('/').filter(Boolean).join('/');
}

function depth(path: string): number {
  return path.split('/').filter(Boolean).length;
}

function highest(roles: Role[]): Role {
  return roles.reduce<Role>((acc, r) => (ROLE_RANK[r] > ROLE_RANK[acc] ? r : acc), Role.NONE);
}

/** true jika `prefix` adalah leluhur-atau-sama dari `path` (berbasis segmen). */
export function isAncestorPath(prefix: string, path: string): boolean {
  const a = normalize(prefix);
  const b = normalize(path);
  if (a === '/') return true;
  return b === a || b.startsWith(a + '/');
}

/**
 * Resolusi peran efektif — satu-satunya sumber kebenaran otorisasi, dipakai
 * baik File Browser (untuk state UI) maupun penegakan di server.
 *
 *  1. peran TERTINGGI dari union grant ruang untuk semua group user;
 *  2. pengecualian per-folder paling SPESIFIK (path terpanjang) menang atas grant ruang;
 *  3. "Tidak ada akses" (NONE) selalu menang — deny-override pada level paling spesifik;
 *  4. superuser mem-bypass seluruh matriks.
 */
export function resolveEffectiveRole(input: ResolveInput): Role {
  if (input.isSuperuser) return Role.MANAGER;

  const groups = new Set(input.userGroupIds);

  const base = highest(
    input.grants
      .filter((g) => g.spaceId === input.spaceId && groups.has(g.groupId))
      .map((g) => g.role),
  );

  const applicable = input.exceptions.filter(
    (e) => e.spaceId === input.spaceId && groups.has(e.groupId) && isAncestorPath(e.folderPath, input.targetPath),
  );
  if (applicable.length === 0) return base;

  const maxDepth = Math.max(...applicable.map((e) => depth(e.folderPath)));
  const deepest = applicable.filter((e) => depth(e.folderPath) === maxDepth);

  // deny-override: NONE pada level paling spesifik selalu menang
  if (deepest.some((e) => e.role === Role.NONE)) return Role.NONE;

  // pengecualian paling spesifik menang atas grant ruang
  return highest(deepest.map((e) => e.role));
}
