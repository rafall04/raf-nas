import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role, ROLE_RANK } from '@rafnas/shared';
import type { Node, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { StorageService } from '../storage/storage.service';
import { categoryOf, extOf, normalizePath } from './category';

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
    sizeBytes: n.sizeBytes,
    updatedAt: n.updatedAt,
    updatedBy,
    itemCount: n.isFolder ? childCount : undefined,
    shared,
    lockedBy: null as string | null,
  };
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

  async upload(user: User, spaceId: string, path: string, file: UploadFile) {
    await this.requireRole(user, spaceId, path, Role.CONTRIBUTOR);
    if (!file?.originalname) throw new BadRequestException('File tidak ada.');

    const parent = await this.parentByPath(spaceId, path);
    const base = path === '/' ? '' : normalizePath(path);
    const target = normalizePath(`${base}/${file.originalname}`);

    const existing = await this.prisma.node.findFirst({ where: { spaceId, path: target } });
    if (existing?.isFolder) throw new ConflictException('Ada folder dengan nama sama.');

    const key = randomUUID();
    await this.storage.save(key, file.buffer);

    let node: Node;
    if (existing) {
      // copy-on-write: versi lama dinonaktifkan, versi baru jadi current
      await this.prisma.fileVersion.updateMany({ where: { nodeId: existing.id }, data: { isCurrent: false } });
      await this.prisma.fileVersion.create({
        data: { nodeId: existing.id, storageKey: key, sizeBytes: BigInt(file.size), isCurrent: true, createdById: user.id },
      });
      node = await this.prisma.node.update({
        where: { id: existing.id },
        data: { sizeBytes: BigInt(file.size), ownerId: user.id, trashedAt: null },
      });
    } else {
      const ext = extOf(file.originalname);
      node = await this.prisma.node.create({
        data: {
          spaceId,
          parentId: parent?.id ?? null,
          name: file.originalname,
          isFolder: false,
          ext,
          category: categoryOf(ext),
          path: target,
          sizeBytes: BigInt(file.size),
          ownerId: user.id,
        },
      });
      await this.prisma.fileVersion.create({
        data: { nodeId: node.id, storageKey: key, sizeBytes: BigInt(file.size), isCurrent: true, createdById: user.id },
      });
    }

    await this.audit(user.id, existing ? 'Ganti versi file' : 'Unggah file', node.id);
    return mapNode(node, user.displayName);
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

    const segs = node.path.split('/').filter(Boolean);
    segs[segs.length - 1] = clean;
    const newPath = normalizePath('/' + segs.join('/'));
    const clash = await this.prisma.node.findFirst({ where: { spaceId: node.spaceId, path: newPath, id: { not: node.id } } });
    if (clash) throw new ConflictException('Nama sudah dipakai.');

    const ext = node.isFolder ? node.ext : extOf(clean);
    const updated = await this.prisma.node.update({
      where: { id: node.id },
      data: { name: clean, path: newPath, ext, category: node.isFolder ? node.category : categoryOf(ext ?? undefined) },
    });
    await this.audit(user.id, 'Ganti nama', node.id);
    return mapNode(updated, user.displayName);
  }

  async trash(user: User, id: string) {
    const node = await this.loadNode(id);
    const role = await this.access.effectiveRole(user, node.spaceId, node.path);
    const isEditor = ROLE_RANK[role] >= ROLE_RANK[Role.EDITOR];
    const isOwnerContributor = ROLE_RANK[role] >= ROLE_RANK[Role.CONTRIBUTOR] && node.ownerId === user.id;
    if (!isEditor && !isOwnerContributor) throw new ForbiddenException('Tidak boleh menghapus file ini.');

    const updated = await this.prisma.node.update({ where: { id: node.id }, data: { trashedAt: new Date(), trashedById: user.id } });
    await this.audit(user.id, 'Pindahkan ke sampah', node.id);
    return mapNode(updated, user.displayName);
  }

  async restore(user: User, id: string) {
    const node = await this.loadNode(id);
    await this.requireRole(user, node.spaceId, node.path, Role.EDITOR);
    const updated = await this.prisma.node.update({ where: { id: node.id }, data: { trashedAt: null, trashedById: null } });
    await this.audit(user.id, 'Pulihkan dari sampah', node.id);
    return mapNode(updated, user.displayName);
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
    for (const n of nodes) {
      for (const v of n.versions) await this.storage.remove(v.storageKey);
    }
    await this.prisma.node.deleteMany({ where: { id: { in: nodes.map((n) => n.id) } } });
    await this.audit(user.id, 'Kosongkan sampah', 'trash');
    return { count: nodes.length };
  }
}
