import { Injectable, StreamableFile } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { ProfileDTO } from './dto/profile-d-t-o';
import { contains } from 'class-validator';
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
    return this.dbService.song.findMany()
  }

  async getVideosToModerate(skip: number): Promise<any> {
    return this.dbService.video.findMany({
      skip: skip,
      take: 30,
      where: {
        under_moderation: true
      },
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
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

  async getContent(id: number): Promise<any> {
    return this.dbService.video.findMany({
      //take: 3, // TODO: remove
      where: {
        id: {
          not: {
            lt: 6
          }
        },
        under_moderation: false,
        allowed: true
      },
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
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

  async findManyVideosByUsername(skip: string, query: string): Promise<any> {
    return this.dbService.video.findMany({
      skip: parseInt(skip),
      take: 10,
      where: {
          OR: [
            {
              song: {
                title: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            },
            {
              song: {
                author_name: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            },
            {
              users: {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            },
            {
              users: {
                lastname: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            }
          ],
        under_moderation: false,
        allowed: true
      },
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
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
