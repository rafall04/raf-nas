import { Injectable } from '@nestjs/common';
import { Role, resolveEffectiveRole, type FolderException, type SpaceGrant } from '@rafnas/shared';
import type { Space, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async groupIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } });
    return rows.map((r) => r.groupId);
  }

  /** Peran efektif user pada sebuah ruang/path — satu-satunya sumber otorisasi. */
  async effectiveRole(user: User, spaceId: string, path = '/'): Promise<Role> {
    if (user.isSuperuser) return Role.MANAGER;
    const groupIds = await this.groupIds(user.id);
    if (groupIds.length === 0) return Role.NONE;

    const grants = await this.prisma.grant.findMany({ where: { spaceId, groupId: { in: groupIds } } });
    const exceptions = await this.prisma.folderException.findMany({ where: { groupId: { in: groupIds } } });

    return resolveEffectiveRole({
      userGroupIds: groupIds,
      spaceId,
      targetPath: path,
      grants: grants.map<SpaceGrant>((g) => ({ groupId: g.groupId, spaceId: g.spaceId, role: g.role as Role })),
      exceptions: exceptions.map<FolderException>((e) => ({ folderPath: e.folderPath, groupId: e.groupId, role: e.role as Role })),
    });
  }

  /** Ruang yang boleh diakses user, beserta peran efektifnya (NONE disaring). */
  async spacesForUser(user: User): Promise<{ space: Space; role: Role }[]> {
    const spaces = await this.prisma.space.findMany({ orderBy: { name: 'asc' } });
    const out: { space: Space; role: Role }[] = [];
    for (const space of spaces) {
      const role = await this.effectiveRole(user, space.id, '/');
      if (role !== Role.NONE) out.push({ space, role });
    }
    return out;
  }
}
