import { Injectable, StreamableFile } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { ProfileDTO } from './dto/profile-d-t-o';
import { createReadStream } from 'fs';

@Injectable()
export class ContentService {
  constructor(private dbService: DbService) {}

  async updateVideoModerationStatus(data): Promise<any> {
    return this.dbService.video.update({
      data: {
        under_moderation: false,
        allowed: data.allowed
      },
      where: {
        id: data.videoId
      }
    })
  }

  async uploadContent(userId: number, data: ProfileDTO, videoId: number): Promise<any> {
    return this.dbService.user.update({
      where: {
        id: userId
      },
      data: {
        image: data.image,
        name: data.name,
        lastname: data.lastname,
        phone_number: data.phone_number.toString(),
        email: data.email,
        city: data.city,
        social_media_link: data.social_media_link,
        age: parseInt(String(data.age)),
        videos: {
          connect: {
            id: videoId
          }
        }
      },
    })
  }

  async uploadSong(data: any): Promise<any> {
    return this.dbService.song.create({
      data: {
        ...data
      }
    })
  }

  async getSongs(): Promise<any> {
    return this.dbService.song.findMany({
      orderBy: {
        id: 'desc'
      }
    })
  }

  async getVideosToModerate(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND video.under_moderation IS TRUE
    ORDER BY video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
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
      }
    })
  }

  async getDeclinedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND NOT video.under_moderation
    ORDER BY video.created_at DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
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
      }
    })
  }

  async getDeclinedVideosCount(): Promise<any> {
    const declinedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND NOT video.under_moderation`

    const acceptedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE video.allowed IS TRUE AND NOT video.under_moderation`

    const underModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND video.under_moderation IS TRUE`

    const totalModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video`

    if (!declinedVideosCount || declinedVideosCount == 'unknown') {
      return 0
    }

    // @ts-ignore
    return {
      accepted: parseInt(acceptedVideosCount[0]?.counttoshow ?? 0),
      declined: parseInt(declinedVideosCount[0]?.counttoshow ?? 0),
      underModeration: parseInt(underModerationVideosCount[0]?.counttoshow ?? 0),
      total: parseInt(totalModerationVideosCount[0]?.counttoshow ?? 0)
    }
  }

  async getApprovedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed IS TRUE AND video.under_moderation IS FALSE
    ORDER BY video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
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
      }
    })
  }

  async getContent(id: number): Promise<any> {
    return {};
    // return this.dbService.video.findMany({
    //   //take: 3, // TODO: remove
    //   where: {
    //     id: {
    //       not: {
    //         lt: 6
    //       }
    //     },
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   orderBy: {
    //     videoLikes: {
    //       _count: 'desc'
    //     }
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

  async findManyVideosByUsername(skip: string, query: string, userId: number, startVideoId: string): Promise<any> {
    const queryToUse = query == 'null' ? '' : query
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id AND videoLike.user_id = ${userId}) as is_liked_by_me, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) as video_likes from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed AND (LOWER(CONCAT(userc.lastname, ' ', userc.name)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(CONCAT(userc.name, ' ', userc.lastname)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(userc.name) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(ss.title) LIKE LOWER(${'%' + queryToUse + '%'}))
    ORDER BY (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) DESC, video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
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
          image: video.image
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
  }

  async findManyUsersByName(name: string): Promise<any> {
    return this.dbService.user.findMany({
      take: 10,
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
      },
      where: {
        name: {
          contains: name
        }
      },
      include: {
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

  async findFirstSongById(id: number): Promise<any> {
    const song = "https://firebasestorage.googleapis.com/v0/b/testing-98cd8.appspot.com/o/images%2F1725226282184?alt=media&token=5c0ccc8f-f8d1-4c65-8385-e21b695de6cb"
    const readStream = createReadStream(song)
    return new StreamableFile(readStream)
    return this.dbService.song.findFirst({
      where: {
        id: id
      }
    })
  }

}
