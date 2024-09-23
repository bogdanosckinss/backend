import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UsersService } from './users.service'
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post()
  async store(@Body() data: any) {
    // await this.userService.store(data)
    // return data.id
  }

  @Public()
  @Get('')
  async getUser(
    @CurrentUser() id: number
  ) {
    if (!id) {
      throw new BadRequestException
    }

    return await this.userService.findOneById(id)
  }

  @Public()
  @Get('/list')
  async getUsers(
    @Query('skip') skip,
    @Query('authors') authors,
  ) {
    return await this.userService.getUsers(skip ?? 0, authors ?? false)
  }

  @Public()
  @Delete('/delete/:id')
  async deleteUser(
    @Param('id') userId
  ) {
    const user  = await this.userService.findOneById(userId)

    if (!user) {
      return 'Not found'
    }

    return await this.userService.deleteById(userId)
  }

  @Public()
  @Put('/image')
  async updateImage(
    @CurrentUser() id: number,
    @Body() data: any
  ) {
    if (!id) {
      throw new BadRequestException
    }

    return await this.userService.updateImage(id, data.image)
  }
}
