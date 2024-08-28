import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { ProfileDTO } from './dto/profile-d-t-o';

@Injectable()
export class ContentService {
  constructor(private dbService: DbService) {}

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

  async getContent(id: number): Promise<any> {
    return this.dbService.video.findMany({
      //take: 3, // TODO: remove
      where: {
        id: {
          not: {
            lt: 6
          }
        }
      },
      orderBy: {
        videoLikes: {
          _count: 'desc'
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
}
