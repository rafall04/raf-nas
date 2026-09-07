import { Controller, ForbiddenException, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { capabilitiesFor, Role } from '@rafnas/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('spaces')
@UseGuards(SessionGuard)
export class SpacesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  @Get()
  async list(@CurrentUser() user: User) {
    const entries = await this.access.spacesForUser(user);
    return Promise.all(
      entries.map(async ({ space, role }) => {
        const fileCount = await this.prisma.node.count({
          where: { spaceId: space.id, isFolder: false, trashedAt: null },
        });
        const agg = await this.prisma.node.aggregate({
          where: { spaceId: space.id, trashedAt: null },
          _sum: { sizeBytes: true },
        });
        return {
          id: space.id,
          name: space.name,
          role,
          quotaBytes: space.quotaBytes,
          usedBytes: agg._sum.sizeBytes ?? BigInt(0),
          fileCount,
        };
      }),
    );
  }

  @Get(':id/nodes')
  async nodes(
    @CurrentUser() user: User,
    @Param('id') spaceId: string,
    @Query('path') path = '/',
  ) {
    const role = await this.access.effectiveRole(user, spaceId, path);
    if (role === Role.NONE) throw new ForbiddenException('Tidak ada akses ke ruang ini.');

    const parent =
      path === '/' ? null : await this.prisma.node.findFirst({ where: { spaceId, path, isFolder: true } });

    const nodes = await this.prisma.node.findMany({
      where: { spaceId, parentId: parent ? parent.id : null, trashedAt: null },
      include: {
        owner: true,
        shareLinks: { where: { status: 'ACTIVE' }, select: { id: true } },
        _count: { select: { children: true } },
      },
    });

    const mapped = nodes
      .map((n) => ({
        id: n.id,
        name: n.name,
        ext: n.ext,
        isFolder: n.isFolder,
        category: n.category,
        sizeBytes: n.sizeBytes,
        updatedAt: n.updatedAt,
        updatedBy: n.owner?.displayName ?? '—',
        itemCount: n.isFolder ? n._count.children : undefined,
        shared: n.shareLinks.length > 0,
        lockedBy: null as string | null,
      }))
      .sort((a, b) => (a.isFolder === b.isFolder ? a.name.localeCompare(b.name) : a.isFolder ? -1 : 1));

    return { role, caps: capabilitiesFor(role), nodes: mapped };
  }
}
