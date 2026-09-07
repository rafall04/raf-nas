import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { User } from '@prisma/client';
import { FilesService } from './files.service';
import { mimeOf } from './category';
import { StorageService } from '../storage/storage.service';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
@UseGuards(SessionGuard)
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly storage: StorageService,
  ) {}

  @Post('spaces/:spaceId/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  upload(
    @CurrentUser() user: User,
    @Param('spaceId') spaceId: string,
    @Query('path') path = '/',
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File tidak ada di request.');
    return this.files.upload(user, spaceId, path, file);
  }

  @Post('spaces/:spaceId/folders')
  createFolder(
    @CurrentUser() user: User,
    @Param('spaceId') spaceId: string,
    @Query('path') path = '/',
    @Body() body: { name?: string },
  ) {
    return this.files.createFolder(user, spaceId, path, body.name ?? '');
  }

  @Get('nodes/:id/download')
  async download(@CurrentUser() user: User, @Param('id') id: string, @Res() res: Response): Promise<void> {
    const { node, key } = await this.files.getDownload(user, id);
    const safeName = node.name.replace(/["\r\n]/g, '');
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    this.storage.stream(key).pipe(res);
  }

  @Get('nodes/:id/content')
  async content(@CurrentUser() user: User, @Param('id') id: string, @Res() res: Response): Promise<void> {
    const { node, key } = await this.files.getDownload(user, id);
    res.set({ 'Content-Type': mimeOf(node.ext), 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff' });
    this.storage.stream(key).pipe(res);
  }

  @Patch('nodes/:id')
  rename(@CurrentUser() user: User, @Param('id') id: string, @Body() body: { name?: string }) {
    return this.files.rename(user, id, body.name ?? '');
  }

  @Post('nodes/:id/trash')
  trash(@CurrentUser() user: User, @Param('id') id: string) {
    return this.files.trash(user, id);
  }

  @Post('nodes/:id/restore')
  restore(@CurrentUser() user: User, @Param('id') id: string) {
    return this.files.restore(user, id);
  }

  @Get('nodes/:id/versions')
  versions(@CurrentUser() user: User, @Param('id') id: string) {
    return this.files.listVersions(user, id);
  }

  @Post('nodes/:id/versions/:vid/restore')
  restoreVersion(@CurrentUser() user: User, @Param('id') id: string, @Param('vid') vid: string) {
    return this.files.restoreVersion(user, id, vid);
  }

  @Get('trash')
  listTrash(@CurrentUser() user: User) {
    return this.files.listTrash(user);
  }

  @Post('trash/empty')
  emptyTrash(@CurrentUser() user: User) {
    return this.files.emptyTrash(user);
  }
}
