import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { ShareService } from './share.service';
import { SessionGuard } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
@UseGuards(SessionGuard)
export class ShareController {
  constructor(private readonly share: ShareService) {}

  @Post('nodes/:id/share')
  create(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { expiryDays?: number; password?: string; downloadLimit?: number },
  ) {
    return this.share.create(user, id, body);
  }

  @Get('sharelinks')
  listMine(@CurrentUser() user: User) {
    return this.share.listMine(user);
  }

  @Post('sharelinks/:id/revoke')
  revoke(@CurrentUser() user: User, @Param('id') id: string) {
    return this.share.revoke(user, id);
  }
}
