import {
  BadRequestException,
  Body,
  Controller,
  Delete, FileTypeValidator,
  Get, MaxFileSizeValidator,
  Param, ParseFilePipe,
  Post, Put,
  Query, Req,
  Res,
  StreamableFile, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { ContentService } from './content.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VideoService } from '../video/video.service';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyReply } from 'fastify';
import {createReadStream} from 'fs'
import { join } from 'path';
import EasyYandexS3 from 'easy-yandex-s3';
import { FileInterceptor } from '@nestjs/platform-express';

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
    return await this.contentService.getContent(id ?? 0) // TODO: remove
  }

  @Delete('/video')
  async delete(
    @CurrentUser() id: string
  ) {
    if (!id) {
      throw new BadRequestException
    }

    return await this.videoService.deleteByUserId(id)
  }

  @Public()
  @Post('/upload/file')
  async uploadFile(
    @Req() req: any,
    @Res() res: any
  ) {
    const data = await req.file()
    console.log(data)
    const buffer = await data.toBuffer()
    let s3 = new EasyYandexS3({
      auth: {
        accessKeyId: 'YCAJEZ4ACpKZcbhV_iv3jZGPh',
        secretAccessKey: 'YCMDP5nIbYuKD06KdZiZQ6sGLxs4WkLsVM2mem_v',
      },
      Bucket: 'like2024',
      debug: true,
    })

    const uploadedFile = await s3.Upload({
      buffer: buffer,
    }, '/images/')

      return res.send({
        link: uploadedFile['Location'],
        buffer: buffer
      })
  }

  @Public()
  @Get('/search/videos')
  async findManyByQuery(
    @Query('skip') skip,
    @Query('query') query,
  ) {
    return await this.contentService.findManyVideosByUsername(skip ?? 0, query)
  }

  @Public()
  @Get('/videos-to-moderate')
  async getVideosToModerate(
    @Query('skip') skip
  ) {
    return await this.contentService.getVideosToModerate(parseInt(skip ?? 0))
  }

  @Public()
  @Get('/download/song')
  async downloadSong(
    @Query('id') id,
    @Res({passthrough: true}) res: FastifyReply,
  ) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file, {
      type: 'application/json',
      disposition: 'attachment; filename="package.json"'
    })
    //const song = await this.contentService.findFirstSongById(parseInt(id ?? 0))
    return res.send()
  }

  @Public()
  @Get('/songs')
  async getSongs(
  ) {
    return await this.contentService.getSongs()
  }

  @Public()
  @Get('/video/:id')
  async getVideoById(
    @Param('id') id
  ) {
    return await this.videoService.findOneById(id) // TODO: add song ID
  }

  @Public()
  @Get('/users/:name')
  async getUsersByName(
    @Param('name') name
  ) {
    return await this.contentService.findManyUsersByName(name)
  }

  @Public()
  @Get('/videos/:name')
  async getVideosByName(
    @Param('name') name
  ) {
    return await this.videoService.findManyByName(name)
  }

  @Public()
  @Post('/update-video-moderation/status')
  async updateVideoModerationStatus(
    @Body() data: any
  ) {
    return await this.contentService.updateVideoModerationStatus(data)
  }

  @Post('/create')
  async create(
    @CurrentUser() id: number,
    @Body() data: any
  ) {
    if (!id) {
      throw new BadRequestException
    }

    const video = await this.videoService.upload(id, data.video, data.songId)

    return await this.contentService.uploadContent(id, data, video.id)
  }

  @Public()
  @Post('/create/song')
  async createSong(
    @Body() data: any
  ) {
    return await this.contentService.uploadSong(data)
  }


  // TODO: VOTES --------------------------------------------------------

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

  @Post('/vote')
  async voteForVideo(
    @CurrentUser() id: number,
    @Body() data: any
  ) {
    if (!id) {
      throw new BadRequestException
    }

    return await this.videoService.vote(id.toString(), data.videoId)
  }

  @Public()
  @Get('/download/songs')
  async download(
  ) {
    return await this.contentService.findFirstSongById(1)
  }

}
