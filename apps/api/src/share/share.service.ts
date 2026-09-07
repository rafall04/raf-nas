import { ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
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

// Rate-limit verifikasi sandi link publik (in-memory, per slug+IP).
const MAX_TRIES = 6;
const LOCK_MS = 60_000;
const tries = new Map<string, { count: number; until: number }>();
function checkLock(key: string): void {
  const s = tries.get(key);
  if (s && s.until > Date.now()) {
    throw new HttpException({ message: 'Terlalu banyak percobaan. Coba lagi sebentar lagi.' }, 429);
  }
  if (s && s.until && s.until <= Date.now()) tries.delete(key);
}
function bumpFail(key: string): void {
  const s = tries.get(key) ?? { count: 0, until: 0 };
  s.count += 1;
  if (s.count >= MAX_TRIES) s.until = Date.now() + LOCK_MS;
  tries.set(key, s);
}
function clearTries(key: string): void {
  tries.delete(key);
}

// Token unduh sekali-pakai (agar sandi tak masuk URL). TTL pendek.
const TOKEN_TTL_MS = 120_000;
const downloadTokens = new Map<string, { slug: string; exp: number }>();

@Injectable()
export class ShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
  ) {}

  async create(user: User, nodeId: string, dto: { expiryDays?: number; password?: string; downloadLimit?: number }) {
    const node = await this.prisma.node.findUnique({ where: { id: nodeId } });
    if (!node || node.trashedAt) throw new NotFoundException('File tidak ditemukan.');
    const role = await this.access.effectiveRole(user, node.spaceId, node.path);
    if (role === Role.NONE) throw new ForbiddenException('Tidak boleh membagikan file ini.');

    const slug = randomBytes(12).toString('base64url');
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
    const links = await this.prisma.shareLink.findMany({ where: { createdById: user.id }, include: { node: true }, orderBy: { createdAt: 'desc' } });
    return links.map((l) => ({
      id: l.id, slug: l.slug, file: l.node.name, created: l.createdAt, expires: l.expiresAt,
      hits: l.downloadCount, hasPassword: !!l.passwordHash, status: statusOf(l),
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

  async publicMeta(slug: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { slug }, include: { node: true } });
    if (!link) throw new NotFoundException('Link tidak ditemukan.');
    const status = statusOf(link);
    if (status === 'REVOKED' || status === 'EXPIRED' || status === 'LIMIT_REACHED') return { status };
    return { status, name: link.node.name, ext: link.node.ext, sizeBytes: link.node.sizeBytes, needsPassword: !!link.passwordHash, expiresAt: link.expiresAt };
  }

  /** Verifikasi sandi (bila ada) + rate-limit, keluarkan token unduh sekali-pakai. */
  async verify(slug: string, password: string | undefined, ip: string | undefined): Promise<{ token: string }> {
    const key = `${slug}|${ip ?? '?'}`;
    checkLock(key);
    const link = await this.prisma.shareLink.findUnique({ where: { slug } });
    if (!link) {
      bumpFail(key);
      throw new NotFoundException('Link tidak ditemukan.');
    }
    const status = statusOf(link);
    if (status === 'REVOKED' || status === 'EXPIRED' || status === 'LIMIT_REACHED') throw new ForbiddenException('Link tidak berlaku lagi.');
    if (link.passwordHash) {
      const ok = password ? await argonVerify(link.passwordHash, password).catch(() => false) : false;
      if (!ok) {
        bumpFail(key);
        throw new ForbiddenException('Kata sandi salah.');
      }
    }
    clearTries(key);
    const token = randomBytes(24).toString('base64url');
    downloadTokens.set(token, { slug, exp: Date.now() + TOKEN_TTL_MS });
    return { token };
  }

  async resolveByToken(slug: string, token: string): Promise<{ name: string; key: string }> {
    const t = downloadTokens.get(token);
    if (!t || t.slug !== slug || t.exp < Date.now()) throw new ForbiddenException('Token unduh tidak valid atau kedaluwarsa.');
    downloadTokens.delete(token); // sekali-pakai
    const link = await this.prisma.shareLink.findUnique({ where: { slug }, include: { node: { include: { versions: { where: { isCurrent: true } } } } } });
    if (!link) throw new NotFoundException();
    if (statusOf(link) === 'REVOKED' || statusOf(link) === 'EXPIRED' || statusOf(link) === 'LIMIT_REACHED') throw new ForbiddenException('Link tidak berlaku lagi.');
    const version = link.node.versions[0];
    if (!version || !this.storage.exists(version.storageKey)) throw new NotFoundException('Isi file tidak tersedia.');
    await this.prisma.shareLink.update({ where: { id: link.id }, data: { downloadCount: { increment: 1 } } });
    await this.prisma.auditEvent.create({ data: { action: 'Unduh via link', objectType: 'node', objectId: link.nodeId } });
    return { name: link.node.name, key: version.storageKey };
  }
}
