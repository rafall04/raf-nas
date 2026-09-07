import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AccessModule } from './access/access.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { SpacesModule } from './spaces/spaces.module';
import { FilesModule } from './files/files.module';
import { SearchModule } from './search/search.module';
import { ShareModule } from './share/share.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccessModule,
    StorageModule,
    HealthModule,
    AuthModule,
    SpacesModule,
    FilesModule,
    SearchModule,
    ShareModule,
    AdminModule,
  ],
})
export class AppModule {}
