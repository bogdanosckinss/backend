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
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Controller('content')
export class ContentController {
  constructor(
    private config: ConfigService,
    private contentService: ContentService,
    private userService: UsersService,
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
  @Get('/search/videos')
  async findManyByQuery(
    @CurrentUser() id: number,
    @Query('skip') skip,
    @Query('query') query,
    @Query('video') video,
  ) {
    return await this.contentService.findManyVideosByUsername(skip ?? 0, query ?? '', id ?? 0, video ?? 0)
  }

  @Public()
  @Get('/videos-to-moderate')
  async getVideosToModerate(
    @Query('skip') skip
  ) {
    return await this.contentService.getVideosToModerate(skip ?? 0)
  }

  @Public()
  @Get('/videos-to-moderate/declined')
  async getDeclinedVideosToModerate(
    @Query('skip') skip
  ) {
    return await this.contentService.getDeclinedVideos(skip ?? 0)
  }

  @Public()
  @Get('/videos-to-moderate/count')
  async getDeclinedVideosCount() {
    return await this.contentService.getDeclinedVideosCount()
  }

  @Public()
  @Get('/videos-to-moderate/approved')
  async getApprovedVideosToModerate(
    @Query('skip') skip
  ) {
    return await this.contentService.getApprovedVideos(skip ?? 0)
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
    @CurrentUser() userId: number,
    @Param('id') id
  ) {
    return await this.videoService.findOneById(id,userId) // TODO: add song ID
  }

  @Public()
  @Get('/users/:name')
  async getUsersByName(
    @Param('name') name
  ) {
    return await this.contentService.findManyUsersByName(name)
  }

  @Public()
  @Get('/users/clean')
  async cleanUsers(
  ) {
    return await this.contentService.cleanUsers('')
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

  @Public()
  @Delete('/update-video-moderation/delete/:id')
  async deleteVideo(
    @Param('id') videoId,
    @Body() data: any
  ) {
    return await this.contentService.deleteVideo(videoId)
  }


  @Post('/create')
  async create(
    @CurrentUser() id: number,
    @Body() data: any,
    @Res({passthrough: true}) res: FastifyReply,
  ) {
    return res.code(404).send('The service is not found')

    if (!id) {
      throw new BadRequestException
    }

    const existingVideo = await this.videoService.findOneByUserId(id.toString())
    if (existingVideo) {
      return res.send()
    }

    const video = await this.videoService.upload(id, data.video, data.songId, data?.preview_url ?? '')
    const uploadContent = await this.contentService.uploadContent(id, data, video.id)
    return res.send(uploadContent)
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
    return {
      message: 'Wrong endpoint'
    }

    if (!id) {
      return {message: 'something happened'}
    }

    const user = await this.userService.findOneById(id)

    if (!user) {
      return {
        message: 'Unauthorized user'
      }
    }

    return await this.videoService.toggleLike(id.toString(), data.videoId)
  }

  @Post('/log')
  async logAMessage(
    @Body() data: any
  ) {
    console.log(data)
    return {}
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
