import { PrismaClient } from '@prisma/client';
import { hash as argonHash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const prisma = new PrismaClient();
const GB = 1024 * 1024 * 1024;
const storageDir = resolve(process.env.STORAGE_DIR ?? join(process.cwd(), 'storage'));
if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });

async function main(): Promise<void> {
  // Bersihkan (urutan aman terhadap relasi)
  await prisma.session.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.fileVersion.deleteMany();
  await prisma.folderException.deleteMany();
  await prisma.grant.deleteMany();
  await prisma.node.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.space.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const pw = await argonHash('rafnas123');
  const adminPw = await argonHash('admin123');

  const groups: Record<string, { id: string }> = {};
  for (const [key, name] of [
    ['prod', 'produksi-staff'],
    ['qc', 'qc-staff'],
    ['qcm', 'qc-manager'],
    ['gd', 'gudang-staff'],
    ['mt', 'maintenance'],
    ['mgr', 'manager-dept'],
  ]) {
    groups[key] = await prisma.group.create({ data: { name } });
  }

  const spaces: Record<string, { id: string }> = {};
  for (const [key, name, q] of [
    ['prod', 'Produksi', 120],
    ['qc', 'QC', 100],
    ['gd', 'Gudang', 80],
    ['mt', 'Maintenance', 60],
  ] as [string, string, number][]) {
    spaces[key] = await prisma.space.create({
      data: { name, quotaBytes: BigInt(q * GB), snapshotPolicy: 'standar' },
    });
  }

  const users: [string, string, string, string[], boolean, boolean][] = [
    ['ani.w', 'Ani Wijaya', pw, ['qc'], false, false],
    ['budi.s', 'Budi Santoso', pw, ['prod'], false, false],
    ['citra.l', 'Citra Lestari', pw, ['qcm', 'mgr'], false, false],
    ['dedi.p', 'Dedi Pratama', pw, ['gd'], false, false],
    ['admin.it', 'Admin IT', adminPw, [], false, true],
  ];
  for (const [username, displayName, passwordHash, gk, mustChange, su] of users) {
    const u = await prisma.user.create({
      data: { username, displayName, passwordHash, mustChangePassword: mustChange, isSuperuser: su },
    });
    for (const k of gk) await prisma.groupMember.create({ data: { groupId: groups[k].id, userId: u.id } });
  }

  const grants: [string, string, string][] = [
    ['prod', 'prod', 'CONTRIBUTOR'],
    ['prod', 'qc', 'VIEWER'],
    ['qc', 'qc', 'CONTRIBUTOR'],
    ['qc', 'prod', 'VIEWER'],
    ['qcm', 'qc', 'MANAGER'],
    ['qcm', 'prod', 'EDITOR'],
    ['gd', 'gd', 'CONTRIBUTOR'],
    ['mt', 'mt', 'EDITOR'],
    ['mt', 'prod', 'VIEWER'],
    ['mgr', 'prod', 'EDITOR'],
    ['mgr', 'qc', 'EDITOR'],
    ['mgr', 'gd', 'EDITOR'],
    ['mgr', 'mt', 'EDITOR'],
  ];
  for (const [g, s, role] of grants) {
    await prisma.grant.create({ data: { groupId: groups[g].id, spaceId: spaces[s].id, role } });
  }

  const folders = ['Laporan harian', 'SOP', 'Drawing teknik', 'Foto mesin', 'Form produksi', 'Manual'];
  const files: [string, string, string][] = [
    ['Laporan-QC-Shift-Malam', 'xlsx', 'sheet'],
    ['SOP-Pengelasan-Rev4', 'pdf', 'pdf'],
    ['Drawing-Rangka-A12', 'dwg', 'cad'],
    ['Foto-Mesin-Bubut-03', 'jpg', 'image'],
    ['Form-Produksi-Agustus', 'xlsx', 'sheet'],
    ['Manual-Kompressor', 'pdf', 'pdf'],
    ['Rekap-Reject-Mingguan', 'csv', 'sheet'],
    ['Presentasi-Audit-Q3', 'pptx', 'slide'],
  ];
  for (const sk of Object.keys(spaces)) {
    const spaceId = spaces[sk].id;
    for (const f of folders) {
      await prisma.node.create({
        data: { spaceId, name: f, isFolder: true, category: 'folder', path: '/' + f },
      });
    }
    let i = 0;
    for (const [base, ext, cat] of files) {
      i++;
      const name = `${base}-${String(i).padStart(3, '0')}.${ext}`;
      const content = `RAF NAS — berkas contoh\nNama: ${name}\nRuang: ${sk}\nIni placeholder demo agar file bisa diunduh.\n`;
      const size = Buffer.byteLength(content);
      const key = randomUUID();
      await writeFile(join(storageDir, key), content);
      const node = await prisma.node.create({
        data: { spaceId, name, isFolder: false, ext, category: cat, path: '/' + name, sizeBytes: BigInt(size) },
      });
      await prisma.fileVersion.create({
        data: { nodeId: node.id, storageKey: key, sizeBytes: BigInt(size), isCurrent: true },
      });
    }
  }

  console.log('Seed selesai. Login dev:');
  console.log('  ani.w / rafnas123    (qc-staff -> Kontributor di QC)');
  console.log('  citra.l / rafnas123  (qc-manager -> Pengelola di QC)');
  console.log('  admin.it / admin123  (superuser)');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
