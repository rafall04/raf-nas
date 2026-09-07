/**
 * Empat peran RAF NAS, konsisten di seluruh produk. NONE dipakai untuk
 * pengecualian per-folder "Tidak ada akses" (deny) dan sebagai default tanpa akses.
 */
export enum Role {
  NONE = 'NONE',
  VIEWER = 'VIEWER',
  CONTRIBUTOR = 'CONTRIBUTOR',
  EDITOR = 'EDITOR',
  MANAGER = 'MANAGER',
}

/** Urutan peran; makin tinggi makin berhak. Dipakai untuk "peran tertinggi menang". */
export const ROLE_RANK: Record<Role, number> = {
  [Role.NONE]: 0,
  [Role.VIEWER]: 1,
  [Role.CONTRIBUTOR]: 2,
  [Role.EDITOR]: 3,
  [Role.MANAGER]: 4,
};

/** Label Bahasa Indonesia baku (sesuai design handoff). */
export const ROLE_LABEL_ID: Record<Role, string> = {
  [Role.NONE]: 'Tidak ada akses',
  [Role.VIEWER]: 'Pelihat',
  [Role.CONTRIBUTOR]: 'Kontributor',
  [Role.EDITOR]: 'Editor',
  [Role.MANAGER]: 'Pengelola',
};

export interface Capabilities {
  view: boolean;
  download: boolean;
  upload: boolean;
  /** hapus file milik sendiri (Kontributor+) */
  deleteOwn: boolean;
  rename: boolean;
  move: boolean;
  /** hapus file milik siapa pun (Editor+) */
  deleteAny: boolean;
  manageAccess: boolean;
}

/** Kapabilitas turunan dari peran. Sumber kebenaran untuk penegakan di server. */
export function capabilitiesFor(role: Role): Capabilities {
  const rank = ROLE_RANK[role];
  return {
    view: rank >= ROLE_RANK[Role.VIEWER],
    download: rank >= ROLE_RANK[Role.VIEWER],
    upload: rank >= ROLE_RANK[Role.CONTRIBUTOR],
    deleteOwn: rank >= ROLE_RANK[Role.CONTRIBUTOR],
    rename: rank >= ROLE_RANK[Role.EDITOR],
    move: rank >= ROLE_RANK[Role.EDITOR],
    deleteAny: rank >= ROLE_RANK[Role.EDITOR],
    manageAccess: rank >= ROLE_RANK[Role.MANAGER],
  };
}
