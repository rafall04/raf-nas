import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperuserGuard } from './superuser.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, SuperuserGuard],
})
export class AdminModule {}
