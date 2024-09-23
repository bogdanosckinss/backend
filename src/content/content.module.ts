import { Module } from '@nestjs/common'
import { ContentService } from './content.service'
import { ContentController } from './content.controller'
import { DbModule } from '../db/db.module'
import { VideoModule } from '../video/video.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  imports: [DbModule, VideoModule, ConfigModule, UsersModule],
  exports: [ContentService],
  providers: [ContentService, ConfigService, UsersService],
  controllers: [ContentController],
})
export class ContentModule {}
