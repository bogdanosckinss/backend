import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContentService } from './content.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VideoService } from '../video/video.service';
import { ProfileDTO } from './dto/profile-d-t-o';
import { Public } from '../auth/decorators/public.decorator';

@Controller('content')
export class ContentController {
  constructor(
    private contentService: ContentService,
    private videoService: VideoService
  ) {}

  @Public()
  @Get('')
  async getContent(
    @Param('id') id
  ) {
    return await this.contentService.getContent(id ?? 0)
  }

  @Public()
  @Get('/video/:id')
  async getVideoById(
    @Param('id') id
  ) {
    return await this.videoService.findOneById(id)
  }

  @Public()
  @Get('/videos/:name')
  async getVideosByName(
    @Param('name') name
  ) {
    return await this.videoService.findManyByName(name)
  }

  @Post('/create')
  async create(
    @CurrentUser() id: number,
    @Body() data: any
  ) {
    if (!id) {
      throw new BadRequestException
    }

    const video = await this.videoService.upload(id, data.video)

    return await this.contentService.uploadContent(id, data, video.id)
  }

  @Post('/toggle-like')
  async toggleLike(
    @CurrentUser() id: number,
    @Body() data: any
  ) {
    if (!id) {
      throw new BadRequestException
    }

    return await this.videoService.toggleLike(id.toString(), data.videoId)
  }
}
