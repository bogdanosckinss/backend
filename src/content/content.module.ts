import { Module } from '@nestjs/common'
import { ContentService } from './content.service'
import { ContentController } from './content.controller'
import { DbModule } from '../db/db.module'
import { VideoModule } from '../video/video.module';

@Module({
  imports: [DbModule, VideoModule],
  exports: [ContentService],
  providers: [ContentService],
  controllers: [ContentController],
})
export class ContentModule {}
