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

  public async confirmPhone(
    userId: number,
  ): Promise<any> {
    const user = await this.findOneById(userId)

    if (user.confirmed) {
      throw new BadRequestException('Phone already confirmed')
    }

    return await this.saveUserConfirmed(userId)
  }

  async findOneByPhone(phone_number: string): Promise<User> {
    return this.dbService.user.findFirst({
      where: {
        phone_number: phone_number,
      }
    })
  }

  async findOneById(id: any): Promise<User> {
    return this.dbService.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        videos: true
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
}
