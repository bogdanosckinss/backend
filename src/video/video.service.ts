import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service'

@Injectable()
export class VideoService {
  constructor(private dbService: DbService) {}

  async upload(userId: number, videoLink: string): Promise<any> {
    return this.dbService.video.create({
      data: {
        link: videoLink,
        user_id: userId
      }
    })
  }

  async toggleLike(userId: string, videoId: string): Promise<any> {
    const like = await this.findLike(userId, videoId)

    if (like) {
      return this.dbService.videoLikes.delete({
        where: {
          id: like.id
        }
      })
    }

    if (!like) {
      return this.dbService.videoLikes.create({
        data: {
          video_id: parseInt(videoId),
          user_id: parseInt(userId)
        }
      })
    }
  }

  async findLike(userId: string, videoId: string): Promise<any> {
    return this.dbService.videoLikes.findFirst({
      where: {
        video_id: parseInt(videoId),
        user_id: parseInt(userId)
      }
    })
  }

  async findManyByName(name: string): Promise<any> {
    return this.dbService.video.findMany({
      take: 10,
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
      },
      where: {
        users: {
          name: {
            contains: name
          }
        }
      },
      include: {
        users: true,
        videoLikes: {
          select: {
            id: true,
            video_id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        }
      }
    })
  }

  async findOneById(videoId: string): Promise<any> {
    return this.dbService.video.findFirst({
      where: {
        id: parseInt(videoId)
      },
      include: {
        users: true,
        videoLikes: {
          select: {
            id: true,
            video_id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        }
      }
    })
  }
}
