import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AdminService } from './admin.service';
import { SessionGuard } from '../auth/session.guard';
import { SuperuserGuard } from './superuser.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('admin')
@UseGuards(SessionGuard, SuperuserGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  users() {
    return this.admin.users();
  }

  @Get('groups')
  groups() {
    return this.admin.groups();
  }

  @Get('spaces')
  spaces() {
    return this.admin.spaces();
  }

  @Get('matrix')
  matrix() {
    return this.admin.matrix();
  }

  @Put('matrix')
  save(@Body() body: { changes?: Record<string, string> }, @CurrentUser() user: User) {
    return this.admin.saveMatrix(body.changes ?? {}, user.id);
  }

  @Get('audit')
  audit() {
    return this.admin.audit();
  }

  @Get('system')
  system() {
    return this.admin.system();
  }
}
