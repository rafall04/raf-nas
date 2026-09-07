import { describe, it, expect } from 'vitest';
import { Role } from './roles';
import { resolveEffectiveRole, isAncestorPath, type ResolveInput } from './permissions';

const base: ResolveInput = {
  userGroupIds: ['g-qc'],
  spaceId: 's-qc',
  targetPath: '/Laporan/Shift-A',
  grants: [{ groupId: 'g-qc', spaceId: 's-qc', role: Role.CONTRIBUTOR }],
  exceptions: [],
};

describe('resolveEffectiveRole', () => {
  it('memakai peran grant ruang bila tanpa pengecualian', () => {
    expect(resolveEffectiveRole(base)).toBe(Role.CONTRIBUTOR);
  });

  it('mengambil peran tertinggi dari beberapa group', () => {
    expect(
      resolveEffectiveRole({
        ...base,
        userGroupIds: ['g-qc', 'g-lead'],
        grants: [
          { groupId: 'g-qc', spaceId: 's-qc', role: Role.VIEWER },
          { groupId: 'g-lead', spaceId: 's-qc', role: Role.EDITOR },
        ],
      }),
    ).toBe(Role.EDITOR);
  });

  it('mengabaikan grant untuk ruang lain', () => {
    expect(
      resolveEffectiveRole({
        ...base,
        grants: [{ groupId: 'g-qc', spaceId: 's-lain', role: Role.MANAGER }],
      }),
    ).toBe(Role.NONE);
  });

  it('pengecualian paling spesifik menang atas grant ruang', () => {
    expect(
      resolveEffectiveRole({
        ...base,
        exceptions: [{ folderPath: '/Laporan', groupId: 'g-qc', role: Role.EDITOR }],
      }),
    ).toBe(Role.EDITOR);
  });

  it('pengecualian lebih dalam mengalahkan yang lebih dangkal', () => {
    expect(
      resolveEffectiveRole({
        ...base,
        exceptions: [
          { folderPath: '/Laporan', groupId: 'g-qc', role: Role.MANAGER },
          { folderPath: '/Laporan/Shift-A', groupId: 'g-qc', role: Role.VIEWER },
        ],
      }),
    ).toBe(Role.VIEWER);
  });

  it('deny-override: NONE selalu menang di level paling spesifik', () => {
    expect(
      resolveEffectiveRole({
        ...base,
        grants: [{ groupId: 'g-qc', spaceId: 's-qc', role: Role.MANAGER }],
        exceptions: [{ folderPath: '/Laporan/Shift-A', groupId: 'g-qc', role: Role.NONE }],
      }),
    ).toBe(Role.NONE);
  });

  it('tanpa grant & tanpa pengecualian = NONE', () => {
    expect(resolveEffectiveRole({ ...base, grants: [] })).toBe(Role.NONE);
  });

  it('superuser mem-bypass matriks', () => {
    expect(resolveEffectiveRole({ ...base, grants: [], isSuperuser: true })).toBe(Role.MANAGER);
  });
});

describe('isAncestorPath', () => {
  it('root adalah leluhur semua', () => {
    expect(isAncestorPath('/', '/apa/pun')).toBe(true);
  });
  it('cocok pada batas segmen, bukan prefiks string', () => {
    expect(isAncestorPath('/Lapor', '/Laporan')).toBe(false);
    expect(isAncestorPath('/Laporan', '/Laporan/Shift-A')).toBe(true);
  });
});
