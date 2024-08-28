import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { VideoService } from './video.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('video')
export class VideoController {
  constructor(private contentService: VideoService) {}

  @Post('/create')
  async create(
    @CurrentUser() id: number,
    @Body() data: any
  ) {
    if (!id) {
      throw new BadRequestException
    }

  }
}
