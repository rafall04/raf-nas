import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async users() {
    const us = await this.prisma.user.findMany({
      include: { memberships: { include: { group: true } } },
      orderBy: { displayName: 'asc' },
    });
    return us.map((u) => ({
      id: u.id,
      name: u.displayName,
      username: u.username,
      initials: initialsOf(u.displayName),
      groups: u.memberships.map((m) => m.group.name),
      active: u.isActive,
      isSuperuser: u.isSuperuser,
      lastLogin: u.lastLoginAt,
    }));
  }

  async groups() {
    const gs = await this.prisma.group.findMany({
      include: { _count: { select: { members: true, grants: true } } },
      orderBy: { name: 'asc' },
    });
    return gs.map((g) => ({ id: g.id, name: g.name, members: g._count.members, spaces: g._count.grants }));
  }

  async spaces() {
    const ss = await this.prisma.space.findMany({
      include: { _count: { select: { grants: true } } },
      orderBy: { name: 'asc' },
    });
    return Promise.all(
      ss.map(async (s) => {
        const agg = await this.prisma.node.aggregate({
          where: { spaceId: s.id, trashedAt: null },
          _sum: { sizeBytes: true },
        });
        return {
          id: s.id,
          name: s.name,
          quotaBytes: s.quotaBytes,
          usedBytes: agg._sum.sizeBytes ?? BigInt(0),
          groups: s._count.grants,
        };
      }),
    );
  }

  async matrix() {
    const [groups, spaces, grants] = await Promise.all([
      this.prisma.group.findMany({ include: { _count: { select: { members: true } } }, orderBy: { name: 'asc' } }),
      this.prisma.space.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.grant.findMany(),
    ]);
    const map: Record<string, string> = {};
    for (const g of grants) map[`${g.groupId}|${g.spaceId}`] = g.role;
    return {
      groups: groups.map((g) => ({ id: g.id, name: g.name, members: g._count.members })),
      spaces: spaces.map((s) => ({ id: s.id, name: s.name })),
      grants: map,
    };
  }

  async saveMatrix(changes: Record<string, string>, actorId: string) {
    for (const [key, role] of Object.entries(changes)) {
      const [groupId, spaceId] = key.split('|');
      if (!groupId || !spaceId) continue;
      if (role === 'NONE') {
        await this.prisma.grant.deleteMany({ where: { groupId, spaceId } });
      } else {
        await this.prisma.grant.upsert({
          where: { groupId_spaceId: { groupId, spaceId } },
          update: { role },
          create: { groupId, spaceId, role },
        });
      }
    }
    await this.prisma.auditEvent.create({
      data: { actorId, action: 'Ubah hak akses', objectType: 'matrix', after: JSON.stringify(changes) },
    });
    return { ok: true, count: Object.keys(changes).length };
  }

  async system() {
    const [spaceCount, userCount, activeUsers, sessionCount, fileCount, agg, spaces] = await Promise.all([
      this.prisma.space.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      this.prisma.node.count({ where: { isFolder: false, trashedAt: null } }),
      this.prisma.node.aggregate({ where: { trashedAt: null }, _sum: { sizeBytes: true } }),
      this.prisma.space.findMany({ select: { quotaBytes: true } }),
    ]);
    const poolUsed = Number(agg._sum.sizeBytes ?? BigInt(0));
    const poolTotal = spaces.reduce((a, s) => a + Number(s.quotaBytes), 0);
    return {
      poolUsed,
      poolTotal,
      rows: [
        { label: 'Ruang', value: String(spaceCount), ok: true },
        { label: 'Pengguna (aktif / total)', value: `${activeUsers} / ${userCount}`, ok: true },
        { label: 'Sesi aktif', value: String(sessionCount), ok: true },
        { label: 'Total file', value: String(fileCount), ok: true },
        { label: 'Snapshot (VSS)', value: 'belum dikonfigurasi', ok: false },
        { label: 'Backup terakhir', value: 'belum dikonfigurasi', ok: false },
        { label: 'Suhu disk / SMART', value: 'tidak tersedia (butuh HBA + agen)', ok: false },
      ],
    };
  }

  async audit() {
    const rows = await this.prisma.auditEvent.findMany({
      include: { actor: true },
      orderBy: { at: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      time: r.at,
      user: r.actor?.username ?? '—',
      action: r.action,
      object: r.objectId ?? r.objectType ?? '',
      ip: r.ip ?? '—',
    }));
  }
}
