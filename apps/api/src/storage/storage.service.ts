import { Injectable, OnModuleInit } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, type ReadStream } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Object-store byte fisik. DEV: folder lokal (STORAGE_DIR, default <cwd>/storage).
 * Produksi: arahkan STORAGE_DIR ke path NTFS. File dinamai storageKey (bukan path
 * logis), jadi rename/pindah logis tak pernah menyentuh byte fisik.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly dir = resolve(process.env.STORAGE_DIR ?? join(process.cwd(), 'storage'));

  onModuleInit(): void {
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
  }

  pathFor(key: string): string {
    return join(this.dir, key);
  }

  async save(key: string, buf: Buffer): Promise<void> {
    await writeFile(this.pathFor(key), buf);
  }

  stream(key: string): ReadStream {
    return createReadStream(this.pathFor(key));
  }

  exists(key: string): boolean {
    return existsSync(this.pathFor(key));
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.pathFor(key));
    } catch {
      /* abaikan bila sudah tiada */
    }
  }
}
