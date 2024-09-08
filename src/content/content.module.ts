import { Module } from '@nestjs/common'
import { ContentService } from './content.service'
import { ContentController } from './content.controller'
import { DbModule } from '../db/db.module'
import { VideoModule } from '../video/video.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [DbModule, VideoModule, ConfigModule],
  exports: [ContentService],
  providers: [ContentService, ConfigService],
  controllers: [ContentController],
})
export class ContentModule {}
