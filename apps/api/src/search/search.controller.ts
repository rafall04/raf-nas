import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('search')
@UseGuards(SessionGuard)
export class SearchController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  @Get()
  async search(@CurrentUser() user: User, @Query('q') q = '', @Query('space') space?: string) {
    const accessible = await this.access.spacesForUser(user);
    const nameMap = new Map(accessible.map((x) => [x.space.id, x.space.name]));
    let ids = accessible.map((x) => x.space.id);
    if (space) ids = ids.filter((id) => id === space);

    const term = q.trim();
    const results = term
      ? await this.prisma.node.findMany({
          where: { spaceId: { in: ids }, isFolder: false, trashedAt: null, name: { contains: term } },
          take: 50,
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    return {
      spaces: accessible.map((x) => ({ id: x.space.id, name: x.space.name })),
      results: results.map((n) => ({
        id: n.id,
        name: n.name,
        ext: n.ext,
        category: n.category,
        sizeBytes: n.sizeBytes,
        updatedAt: n.updatedAt,
        spaceId: n.spaceId,
        spaceName: nameMap.get(n.spaceId) ?? '—',
        path: `/${nameMap.get(n.spaceId) ?? ''}${n.path}`,
      })),
    };
  }
}
