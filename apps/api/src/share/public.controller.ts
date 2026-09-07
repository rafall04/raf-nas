import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ShareService } from './share.service';
import { StorageService } from '../storage/storage.service';

/** Endpoint publik — TANPA autentikasi. Sengaja tidak membocorkan struktur internal. */
@Controller('public')
export class PublicController {
  constructor(
    private readonly share: ShareService,
    private readonly storage: StorageService,
  ) {}

  @Get(':slug')
  meta(@Param('slug') slug: string) {
    return this.share.publicMeta(slug);
  }

  @Get(':slug/download')
  async download(@Param('slug') slug: string, @Query('password') password: string | undefined, @Res() res: Response): Promise<void> {
    const { name, key } = await this.share.resolveForDownload(slug, password);
    const safeName = name.replace(/["\r\n]/g, '');
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    this.storage.stream(key).pipe(res);
  }
}
