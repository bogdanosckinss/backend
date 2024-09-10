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
    return {}
    // return this.dbService.video.findMany({
    //   take: 500,
    //   orderBy: {
    //     videoLikes: {
    //       _count: 'desc'
    //     }
    //   },
    //   where: {
    //     users: {
    //       name: {
    //         contains: name
    //       }
    //     },
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   include: {
    //     users: true,
    //     song: true,
    //     videoLikes: {
    //       select: {
    //         id: true,
    //         video_id: true,
    //         user: {
    //           select: {
    //             id: true,
    //           },
    //         },
    //       },
    //     }
    //   }
    // })
  }

  async findOneById(videoId: string, userId: number): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id AND videoLike.user_id = ${userId}) as is_liked_by_me, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) as video_likes, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed IS TRUE AND video.under_moderation IS FALSE AND video.id = ${parseInt(videoId)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    if (videos.length == 0) {
      return {}
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
        video_likes: '',
        is_liked_by_me: parseInt(video.is_liked_by_me) > 0,
        videoLikes: parseInt(video.video_likes)
      }
    })
    return {}
    // return this.dbService.video.findMany({
    //   where: {
    //     id: parseInt(videoId),
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   include: {
    //     users: true,
    //     song: true,
    //     videoLikes: {
    //       select: {
    //         id: true,
    //         video_id: true,
    //         user: {
    //           select: {
    //             id: true,
    //           },
    //         },
    //       },
    //     }
    //   }
    // })
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
    return {}
    // return this.dbService.video.findFirst({
    //   where: {
    //     users: {
    //       id: parseInt(userId)
    //     },
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   include: {
    //     users: true,
    //     song: true,
    //     videoLikes: {
    //       select: {
    //         id: true,
    //         video_id: true,
    //         user: {
    //           select: {
    //             id: true,
    //           },
    //         },
    //       },
    //     }
    //   }
    // })
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
      // return this.dbService.video.update({
      //   where: {
      //     id: parseInt(videoId)
      //   },
      //   data: {
      //     videoLikes: {
      //       connect: {
      //         video_id: parseInt(videoId),
      //         user_id: parseInt(userId)
      //       }
      //     }
      //   }
      // })
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
