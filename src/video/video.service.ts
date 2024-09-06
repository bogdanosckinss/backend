import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service'

@Injectable()
export class VideoService {
  constructor(private dbService: DbService) {}

  async upload(userId: number, videoLink: string, songId: number): Promise<any> {
    return this.dbService.video.create({
      data: {
        link: videoLink,
        user_id: userId,
        song_id: songId
      }
    })
  }

  async findManyByName(name: string): Promise<any> {
    return this.dbService.video.findMany({
      take: 500,
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
        },
        under_moderation: false,
        allowed: true
      },
      include: {
        users: true,
        song: true,
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
    return this.dbService.video.findMany({
      where: {
        id: parseInt(videoId),
        under_moderation: false,
        allowed: true
      },
      include: {
        users: true,
        song: true,
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

  async deleteByUserId(userId: string): Promise<any> {
    return this.dbService.video.deleteMany({
      where: {
        users: {
          id: parseInt(userId)
        }
      }
    })
  }

  async findOneByUserId(userId: string): Promise<any> {
    return this.dbService.video.findFirst({
      where: {
        users: {
          id: parseInt(userId)
        },
        under_moderation: false,
        allowed: true
      },
      include: {
        users: true,
        song: true,
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



  // TODO: VOTING ----------------------------------------------------------

  async findLike(userId: string, videoId: string): Promise<any> {
    return this.dbService.videoLikes.findFirst({
      where: {
        video_id: parseInt(videoId),
        user_id: parseInt(userId)
      }
    })
  }

  async findVote(userId: string, videoId: string): Promise<any> {
    return this.dbService.videoVotes.findFirst({
      where: {
        video_id: parseInt(videoId),
        user_id: parseInt(userId)
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

  async vote(userId: string, videoId: string): Promise<any> {
    const vote = await this.findVote(userId, videoId)

    if (!vote) {
      return this.dbService.videoVotes.create({
        data: {
          video_id: parseInt(videoId),
          user_id: parseInt(userId)
        }
      })
    }
  }
}
