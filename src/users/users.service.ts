import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { User } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private dbService: DbService) {}

  async create(data: any): Promise<any> {
    return this.dbService.user.create({
      data: {
        phone_number: data.phone_number,
        name: data.name
      },
    })
  }

  async createViaEmail(data: any): Promise<any> {
    return this.dbService.user.create({
      data: {
        email: data.email,
        name: data.name
      },
    })
  }

  public async confirmPhone(
    userId: number,
  ): Promise<any> {
    const user = await this.findOneById(userId)

    if (user.confirmed) {
      throw new BadRequestException('Phone already confirmed')
    }

    return await this.saveUserConfirmed(userId)
  }

  async findOneByPhone(phone: string): Promise<User> {
    return this.dbService.user.findFirst({
      where: {
        phone_number: phone,
      }
    })
  }

  async getUsers(skip: string, authors: boolean): Promise<User[]> {
    return this.dbService.user.findMany({
      where: !authors ?
        {
          videos: {
            none: {

            }
          }
        } : {},
      skip: parseInt(skip),
      take: 200,
      orderBy: {
        id: 'desc'
      }
    })
  }

  async deleteById(id: string): Promise<User> {
    return this.dbService.user.delete({
      where: {
        id: parseInt(id)
      }
    })
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.dbService.user.findFirst({
      where: {
        email: email,
      }
    })
  }

  async findOneById(id: any): Promise<User> {
    return this.dbService.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        videos: {
          include: {
            song: true
          }
        },
      }
    })
  }

  async saveUserConfirmed(id: number): Promise<any> {
    return this.dbService.user.update({
      where: {
        id: id
      },
      data: {
        confirmed: false // TODO: true
      }
    })
  }

  async updateImage(id: number, image: string): Promise<any> {
    return this.dbService.user.update({
      where: {
        id: id
      },
      data: {
        image: image
      }
    })
  }
}
