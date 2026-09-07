import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { Role } from '@rafnas/shared';
import type { ShareLink, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { StorageService } from '../storage/storage.service';

export type LinkStatus = 'ACTIVE' | 'SOON' | 'EXPIRED' | 'LIMIT_REACHED' | 'REVOKED';

function statusOf(link: ShareLink): LinkStatus {
  const now = Date.now();
  if (link.revokedAt) return 'REVOKED';
  if (link.expiresAt.getTime() < now) return 'EXPIRED';
  if (link.downloadLimit != null && link.downloadCount >= link.downloadLimit) return 'LIMIT_REACHED';
  if (link.expiresAt.getTime() - now < 3 * 86_400_000) return 'SOON';
  return 'ACTIVE';
}

interface CreateDto {
  expiryDays?: number;
  password?: string;
  downloadLimit?: number;
}

@Injectable()
export class ShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
  ) {}

  async create(user: User, nodeId: string, dto: CreateDto) {
    const node = await this.prisma.node.findUnique({ where: { id: nodeId } });
    if (!node || node.trashedAt) throw new NotFoundException('File tidak ditemukan.');
    const role = await this.access.effectiveRole(user, node.spaceId, node.path);
    if (role === Role.NONE) throw new ForbiddenException('Tidak boleh membagikan file ini.');

    const slug = randomBytes(12).toString('base64url'); // ~16 char, CSPRNG
    const passwordHash = dto.password ? await argonHash(dto.password) : null;
    const days = dto.expiryDays && dto.expiryDays > 0 ? dto.expiryDays : 7;
    const link = await this.prisma.shareLink.create({
      data: {
        nodeId,
        slug,
        passwordHash,
        expiresAt: new Date(Date.now() + days * 86_400_000),
        downloadLimit: dto.downloadLimit && dto.downloadLimit > 0 ? dto.downloadLimit : null,
        createdById: user.id,
        status: 'ACTIVE',
      },
    });
    await this.prisma.auditEvent.create({ data: { actorId: user.id, action: 'Buat link berbagi', objectType: 'node', objectId: nodeId } });
    return { slug, url: `https://rafnas.sfl.local/l/${slug}`, expiresAt: link.expiresAt };
  }

  async listMine(user: User) {
    const links = await this.prisma.shareLink.findMany({
      where: { createdById: user.id },
      include: { node: true },
      orderBy: { createdAt: 'desc' },
    });
    return links.map((l) => ({
      id: l.id,
      slug: l.slug,
      file: l.node.name,
      created: l.createdAt,
      expires: l.expiresAt,
      hits: l.downloadCount,
      hasPassword: !!l.passwordHash,
      status: statusOf(l),
    }));
  }

  async revoke(user: User, id: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException();
    if (link.createdById !== user.id && !user.isSuperuser) throw new ForbiddenException();
    await this.prisma.shareLink.update({ where: { id }, data: { revokedAt: new Date(), status: 'REVOKED' } });
    await this.prisma.auditEvent.create({ data: { actorId: user.id, action: 'Cabut link berbagi', objectType: 'shareLink', objectId: id } });
    return { ok: true };
  }

  /** Meta publik — tanpa membocorkan ruang/path internal. */
  async publicMeta(slug: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { slug }, include: { node: true } });
    if (!link) throw new NotFoundException('Link tidak ditemukan.');
    const status = statusOf(link);
    if (status === 'REVOKED' || status === 'EXPIRED' || status === 'LIMIT_REACHED') {
      return { status };
    }
    return {
      status,
      name: link.node.name,
      ext: link.node.ext,
      sizeBytes: link.node.sizeBytes,
      needsPassword: !!link.passwordHash,
      expiresAt: link.expiresAt,
    };
  }

  async resolveForDownload(slug: string, password?: string): Promise<{ name: string; key: string; nodeId: string }> {
    const link = await this.prisma.shareLink.findUnique({
      where: { slug },
      include: { node: { include: { versions: { where: { isCurrent: true } } } } },
    });
    if (!link) throw new NotFoundException('Link tidak ditemukan.');
    const status = statusOf(link);
    if (status === 'REVOKED' || status === 'EXPIRED' || status === 'LIMIT_REACHED') {
      throw new ForbiddenException('Link tidak berlaku lagi.');
    }
    if (link.passwordHash) {
      const ok = password ? await argonVerify(link.passwordHash, password).catch(() => false) : false;
      if (!ok) throw new ForbiddenException('Kata sandi salah.');
    }
    const version = link.node.versions[0];
    if (!version || !this.storage.exists(version.storageKey)) throw new NotFoundException('Isi file tidak tersedia.');

    await this.prisma.shareLink.update({ where: { id: link.id }, data: { downloadCount: { increment: 1 } } });
    await this.prisma.auditEvent.create({ data: { action: 'Unduh via link', objectType: 'node', objectId: link.nodeId } });
    return { name: link.node.name, key: version.storageKey, nodeId: link.nodeId };
  }
}
