import { Module } from '@nestjs/common'
import { VideoService } from './video.service'
import { VideoController } from './video.controller'
import { DbModule } from '../db/db.module'

@Module({
  imports: [DbModule],
  exports: [VideoService],
  providers: [VideoService],
  controllers: [VideoController],
})
export class VideoModule {}
