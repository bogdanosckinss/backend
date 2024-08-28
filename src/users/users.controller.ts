import { Body, Controller, Post } from '@nestjs/common'
import { UserDto } from './dto/user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post()
  async store(@Body() data: any) {
    // await this.userService.store(data)
    // return data.id
  }

/*  @Put('/update-name-info')
  async saveNameInfo(
    @CurrentUser() id: number,
    @Body() data: UserUpdateNameInfoDto
  ) {
    await this.userService.saveNameInfo(data, id)
  }*/
}
