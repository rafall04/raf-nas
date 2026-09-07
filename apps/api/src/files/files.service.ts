import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role, ROLE_RANK } from '@rafnas/shared';
import { Prisma, type Node, type User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { StorageService } from '../storage/storage.service';
import { categoryOf, extOf, normalizePath, sanitizeFileName } from './category';

interface UploadFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

function mapNode(n: Node, updatedBy: string, childCount = 0, shared = false) {
  return {
    id: n.id,
    name: n.name,
    ext: n.ext,
    isFolder: n.isFolder,
    category: n.category,
    path: n.path,
    sizeBytes: n.sizeBytes,
    updatedAt: n.updatedAt,
    updatedBy,
    itemCount: n.isFolder ? childCount : undefined,
    shared,
    lockedBy: null as string | null,
  };
}

function parentPathOf(path: string): string {
  return normalizePath('/' + path.split('/').filter(Boolean).slice(0, -1).join('/'));
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
  ) {}

  private async requireRole(user: User, spaceId: string, path: string, min: Role): Promise<Role> {
    const role = await this.access.effectiveRole(user, spaceId, path);
    if (ROLE_RANK[role] < ROLE_RANK[min]) throw new ForbiddenException('Tidak cukup hak akses.');
    return role;
  }

  private async parentByPath(spaceId: string, path: string): Promise<Node | null> {
    if (path === '/' || path === '') return null;
    const parent = await this.prisma.node.findFirst({
      where: { spaceId, path: normalizePath(path), isFolder: true, trashedAt: null },
    });
    if (!parent) throw new NotFoundException('Folder tujuan tidak ditemukan.');
    return parent;
  }

  private async audit(actorId: string, action: string, objectId: string): Promise<void> {
    await this.prisma.auditEvent.create({ data: { actorId, action, objectType: 'node', objectId } });
  }

  /** Sisa kuota: lempar 413 bila unggahan akan melampaui kuota ruang. */
  private async assertQuota(spaceId: string, addBytes: number, replacingBytes = 0): Promise<void> {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    const quota = space ? Number(space.quotaBytes) : 0;
    if (quota <= 0) return; // 0 = tak terbatas
    const agg = await this.prisma.node.aggregate({ where: { spaceId, trashedAt: null }, _sum: { sizeBytes: true } });
    const used = Number(agg._sum.sizeBytes ?? BigInt(0));
    if (used - replacingBytes + addBytes > quota) {
      throw new HttpException({ message: 'Kuota ruang tidak mencukupi untuk file ini.' }, 413);
    }
  }

  async upload(user: User, spaceId: string, path: string, file: UploadFile) {
    await this.requireRole(user, spaceId, path, Role.CONTRIBUTOR);
    const name = sanitizeFileName(file?.originalname ?? '');
    if (!name) throw new BadRequestException('Nama file tidak valid.');

    const parent = await this.parentByPath(spaceId, path);
    const base = path === '/' ? '' : normalizePath(path);
    const target = normalizePath(`${base}/${name}`);

    const existing = await this.prisma.node.findFirst({ where: { spaceId, path: target } });
    if (existing?.isFolder) throw new ConflictException('Ada folder dengan nama sama.');

    await this.assertQuota(spaceId, file.size, existing ? Number(existing.sizeBytes) : 0);

    const key = randomUUID();
    await this.storage.save(key, file.buffer);
    try {
      const node = await this.prisma.$transaction(async (tx) => {
        if (existing) {
          // copy-on-write: versi lama dinonaktifkan, versi baru jadi current
          await tx.fileVersion.updateMany({ where: { nodeId: existing.id }, data: { isCurrent: false } });
          await tx.fileVersion.create({
            data: { nodeId: existing.id, storageKey: key, sizeBytes: BigInt(file.size), isCurrent: true, createdById: user.id },
          });
          return tx.node.update({
            where: { id: existing.id },
            data: { sizeBytes: BigInt(file.size), ownerId: user.id, trashedAt: null },
          });
        }
        const ext = extOf(name);
        const created = await tx.node.create({
          data: {
            spaceId,
            parentId: parent?.id ?? null,
            name,
            isFolder: false,
            ext,
            category: categoryOf(ext),
            path: target,
            sizeBytes: BigInt(file.size),
            ownerId: user.id,
          },
        });
        await tx.fileVersion.create({
          data: { nodeId: created.id, storageKey: key, sizeBytes: BigInt(file.size), isCurrent: true, createdById: user.id },
        });
        return created;
      });
      await this.audit(user.id, existing ? 'Ganti versi file' : 'Unggah file', node.id);
      return mapNode(node, user.displayName);
    } catch (e) {
      // Rollback DB gagal → jangan tinggalkan byte yatim di object store.
      await this.storage.remove(key).catch(() => {});
      throw e;
    }
  }

  async createFolder(user: User, spaceId: string, path: string, name: string) {
    await this.requireRole(user, spaceId, path, Role.CONTRIBUTOR);
    const clean = name.trim();
    if (!clean || clean.includes('/')) throw new BadRequestException('Nama folder tidak boleh kosong atau memakai tanda garis miring.');

    const parent = await this.parentByPath(spaceId, path);
    const base = path === '/' ? '' : normalizePath(path);
    const target = normalizePath(`${base}/${clean}`);

    const exists = await this.prisma.node.findFirst({ where: { spaceId, path: target } });
    if (exists) throw new ConflictException('Nama sudah dipakai di folder ini.');

    const node = await this.prisma.node.create({
      data: { spaceId, parentId: parent?.id ?? null, name: clean, isFolder: true, category: 'folder', path: target },
    });
    await this.audit(user.id, 'Buat folder', node.id);
    return mapNode(node, user.displayName, 0);
  }

  private async loadNode(id: string): Promise<Node> {
    const node = await this.prisma.node.findUnique({ where: { id } });
    if (!node) throw new NotFoundException('File tidak ditemukan.');
    return node;
  }

  async getDownload(user: User, id: string): Promise<{ node: Node; key: string }> {
    const node = await this.loadNode(id);
    if (node.trashedAt) throw new NotFoundException('File ada di sampah.');
    if (node.isFolder) throw new BadRequestException('Tidak bisa mengunduh folder.');
    await this.requireRole(user, node.spaceId, node.path, Role.VIEWER);

    const version = await this.prisma.fileVersion.findFirst({ where: { nodeId: node.id, isCurrent: true } });
    if (!version || !this.storage.exists(version.storageKey)) throw new NotFoundException('Isi file tidak tersedia.');
    await this.audit(user.id, 'Unduh file', node.id);
    return { node, key: version.storageKey };
  }

  async rename(user: User, id: string, name: string) {
    const node = await this.loadNode(id);
    await this.requireRole(user, node.spaceId, node.path, Role.EDITOR);
    const clean = name.trim();
    if (!clean || clean.includes('/')) throw new BadRequestException('Nama tidak boleh kosong atau memakai tanda garis miring.');

    const newPath = normalizePath(`${parentPathOf(node.path) === '/' ? '' : parentPathOf(node.path)}/${clean}`);
    const clash = await this.prisma.node.findFirst({ where: { spaceId: node.spaceId, path: newPath, id: { not: node.id } } });
    if (clash) throw new ConflictException('Nama sudah dipakai.');

    const ext = node.isFolder ? node.ext : extOf(clean);
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.node.update({
        where: { id: node.id },
        data: { name: clean, path: newPath, ext, category: node.isFolder ? node.category : categoryOf(ext ?? undefined) },
      });
      if (node.isFolder) await this.repathDescendants(tx, node.spaceId, node.path, newPath);
      return u;
    });
    await this.audit(user.id, 'Ganti nama', node.id);
    return mapNode(updated, user.displayName);
  }

  /** Pindahkan node (file/folder) ke folder tujuan (destPath) dalam ruang yang sama. */
  async move(user: User, id: string, destPath: string) {
    const node = await this.loadNode(id);
    if (node.trashedAt) throw new BadRequestException('Item ada di sampah.');
    await this.requireRole(user, node.spaceId, node.path, Role.EDITOR); // sumber
    const dest = normalizePath(destPath || '/');
    await this.requireRole(user, node.spaceId, dest, Role.CONTRIBUTOR); // tujuan

    if (dest === parentPathOf(node.path)) return mapNode(node, user.displayName); // sudah di sana
    if (node.isFolder && (dest === node.path || dest.startsWith(node.path + '/'))) {
      throw new BadRequestException('Tidak bisa memindahkan folder ke dalam dirinya sendiri.');
    }

    const parent = await this.parentByPath(node.spaceId, dest);
    const newPath = normalizePath(`${dest === '/' ? '' : dest}/${node.name}`);
    const clash = await this.prisma.node.findFirst({ where: { spaceId: node.spaceId, path: newPath, id: { not: node.id } } });
    if (clash) throw new ConflictException('Sudah ada item dengan nama sama di folder tujuan.');

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.node.update({ where: { id: node.id }, data: { parentId: parent?.id ?? null, path: newPath } });
      if (node.isFolder) await this.repathDescendants(tx, node.spaceId, node.path, newPath);
      return u;
    });
    await this.audit(user.id, 'Pindahkan', node.id);
    return mapNode(updated, user.displayName);
  }

  /** Perbarui path seluruh turunan folder saat folder di-rename/pindah. */
  private async repathDescendants(tx: Prisma.TransactionClient, spaceId: string, oldPath: string, newPath: string): Promise<void> {
    const descendants = await tx.node.findMany({
      where: { spaceId, path: { startsWith: oldPath + '/' } },
      select: { id: true, path: true },
    });
    for (const d of descendants) {
      const rest = d.path.slice(oldPath.length); // termasuk '/' di depan
      await tx.node.update({ where: { id: d.id }, data: { path: normalizePath(newPath + rest) } });
    }
  }

  /** Daftar folder di sebuah ruang untuk pemilih tujuan (menghormati akses per-folder). */
  async listFolders(user: User, spaceId: string): Promise<{ path: string; name: string }[]> {
    const role = await this.access.effectiveRole(user, spaceId, '/');
    if (role === Role.NONE) throw new ForbiddenException('Tidak ada akses ke ruang ini.');
    const folders = await this.prisma.node.findMany({
      where: { spaceId, isFolder: true, trashedAt: null },
      orderBy: { path: 'asc' },
      select: { path: true },
    });
    const out: { path: string; name: string }[] = [{ path: '/', name: '(root ruang)' }];
    for (const f of folders) {
      const r = await this.access.effectiveRole(user, spaceId, f.path);
      if (r !== Role.NONE) out.push({ path: f.path, name: f.path });
    }
    return out;
  }

  async trash(user: User, id: string) {
    const node = await this.loadNode(id);
    const role = await this.access.effectiveRole(user, node.spaceId, node.path);
    const isEditor = ROLE_RANK[role] >= ROLE_RANK[Role.EDITOR];
    const isOwnerContributor = ROLE_RANK[role] >= ROLE_RANK[Role.CONTRIBUTOR] && node.ownerId === user.id;
    if (!isEditor && !isOwnerContributor) throw new ForbiddenException('Tidak boleh menghapus file ini.');

    const now = new Date();
    if (node.isFolder) {
      const descendants = await this.prisma.node.findMany({
        where: { spaceId: node.spaceId, path: { startsWith: node.path + '/' }, trashedAt: null },
        select: { id: true },
      });
      const ids = [node.id, ...descendants.map((d) => d.id)];
      await this.prisma.node.updateMany({ where: { id: { in: ids } }, data: { trashedAt: now, trashedById: user.id } });
    } else {
      await this.prisma.node.update({ where: { id: node.id }, data: { trashedAt: now, trashedById: user.id } });
    }
    await this.audit(user.id, 'Pindahkan ke sampah', node.id);
    return mapNode(await this.loadNode(node.id), user.displayName);
  }

  async restore(user: User, id: string) {
    const node = await this.loadNode(id);
    await this.requireRole(user, node.spaceId, node.path, Role.EDITOR);
    if (node.isFolder && node.trashedAt) {
      // pulihkan folder + seluruh turunan yang dibuang di batch yang sama
      const descendants = await this.prisma.node.findMany({
        where: { spaceId: node.spaceId, path: { startsWith: node.path + '/' }, trashedAt: node.trashedAt },
        select: { id: true },
      });
      const ids = [node.id, ...descendants.map((d) => d.id)];
      await this.prisma.node.updateMany({ where: { id: { in: ids } }, data: { trashedAt: null, trashedById: null } });
    } else {
      await this.prisma.node.update({ where: { id: node.id }, data: { trashedAt: null, trashedById: null } });
    }
    await this.audit(user.id, 'Pulihkan dari sampah', node.id);
    return mapNode(await this.loadNode(node.id), user.displayName);
  }

  async listTrash(user: User) {
    const spaces = await this.access.spacesForUser(user);
    const spaceName = new Map(spaces.map((x) => [x.space.id, x.space.name]));
    const nodes = await this.prisma.node.findMany({
      where: { spaceId: { in: spaces.map((x) => x.space.id) }, trashedAt: { not: null } },
      orderBy: { trashedAt: 'desc' },
    });
    const byIds = [...new Set(nodes.map((n) => n.trashedById).filter((x): x is string => !!x))];
    const users = await this.prisma.user.findMany({ where: { id: { in: byIds } }, select: { id: true, username: true } });
    const uname = new Map(users.map((u) => [u.id, u.username]));

    return nodes.map((n) => {
      const segs = n.path.split('/').filter(Boolean);
      const originSegs = segs.slice(0, -1);
      const space = spaceName.get(n.spaceId) ?? '—';
      const days = 30 - Math.floor((Date.now() - (n.trashedAt as Date).getTime()) / 86_400_000);
      return {
        id: n.id,
        name: n.name,
        ext: n.ext,
        category: n.category,
        isFolder: n.isFolder,
        space,
        originName: originSegs.length ? originSegs[originSegs.length - 1] : space,
        originPath: `/${[space, ...originSegs].join('/')}`,
        by: n.trashedById ? uname.get(n.trashedById) ?? '—' : '—',
        trashedAt: n.trashedAt,
        daysLeft: Math.max(0, days),
      };
    });
  }

  async listVersions(user: User, nodeId: string) {
    const node = await this.loadNode(nodeId);
    if (node.trashedAt) throw new NotFoundException('File ada di sampah.');
    await this.requireRole(user, node.spaceId, node.path, Role.VIEWER);
    const versions = await this.prisma.fileVersion.findMany({ where: { nodeId }, orderBy: { createdAt: 'desc' } });
    const ids = [...new Set(versions.map((v) => v.createdById).filter((x): x is string => !!x))];
    const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, displayName: true } });
    const uname = new Map(users.map((u) => [u.id, u.displayName]));
    return versions.map((v) => ({
      id: v.id,
      sizeBytes: v.sizeBytes,
      createdAt: v.createdAt,
      by: v.createdById ? uname.get(v.createdById) ?? '—' : '—',
      isCurrent: v.isCurrent,
    }));
  }

  async restoreVersion(user: User, nodeId: string, versionId: string) {
    const node = await this.loadNode(nodeId);
    await this.requireRole(user, node.spaceId, node.path, Role.EDITOR);
    const ver = await this.prisma.fileVersion.findFirst({ where: { id: versionId, nodeId } });
    if (!ver) throw new NotFoundException('Versi tidak ditemukan.');
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.fileVersion.updateMany({ where: { nodeId }, data: { isCurrent: false } });
      await tx.fileVersion.update({ where: { id: versionId }, data: { isCurrent: true } });
      return tx.node.update({ where: { id: nodeId }, data: { sizeBytes: ver.sizeBytes, ownerId: user.id } });
    });
    await this.audit(user.id, 'Pulihkan versi', nodeId);
    return mapNode(updated, user.displayName);
  }

  async emptyTrash(user: User): Promise<{ count: number }> {
    const spaces = await this.access.spacesForUser(user);
    const editorSpaceIds = spaces
      .filter((x) => ROLE_RANK[x.role] >= ROLE_RANK[Role.EDITOR])
      .map((x) => x.space.id);
    if (editorSpaceIds.length === 0) throw new ForbiddenException('Tidak cukup hak untuk mengosongkan sampah.');

    const nodes = await this.prisma.node.findMany({
      where: { spaceId: { in: editorSpaceIds }, trashedAt: { not: null } },
      include: { versions: true },
    });
    const ids = nodes.map((n) => n.id);
    const keys = nodes.flatMap((n) => n.versions.map((v) => v.storageKey));
    // Hapus baris DB dulu (cascade menghapus versi); baru buang byte (best-effort).
    await this.prisma.node.deleteMany({ where: { id: { in: ids } } });
    for (const k of keys) await this.storage.remove(k).catch(() => {});
    await this.audit(user.id, 'Kosongkan sampah', 'trash');
    return { count: nodes.length };
  }
}
