import { Body, Controller, Get, Ip, Param, Post, Query, Res } from '@nestjs/common';
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

  /** Verifikasi sandi (bila ada) + rate-limit; kembalikan token unduh sekali-pakai. Sandi TIDAK pernah masuk URL. */
  @Post(':slug/verify')
  verify(@Param('slug') slug: string, @Body('password') password: string | undefined, @Ip() ip: string): Promise<{ token: string }> {
    return this.share.verify(slug, password, ip);
  }

  @Get(':slug/download')
  async download(@Param('slug') slug: string, @Query('token') token: string, @Res() res: Response): Promise<void> {
    const { name, key } = await this.share.resolveByToken(slug, token);
    const safeName = name.replace(/["\r\n]/g, '');
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    this.storage.stream(key).pipe(res);
  }
}
