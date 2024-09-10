import { BadRequestException, Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
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


/*  @Put('/update-name-info')
  async saveNameInfo(
    @CurrentUser() id: number,
    @Body() data: UserUpdateNameInfoDto
  ) {
    await this.userService.saveNameInfo(data, id)
  }*/
}
