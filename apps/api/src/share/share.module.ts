import { Module } from '@nestjs/common';
import { ShareController } from './share.controller';
import { PublicController } from './public.controller';
import { ShareService } from './share.service';

@Module({
  controllers: [ShareController, PublicController],
  providers: [ShareService],
})
export class ShareModule {}
