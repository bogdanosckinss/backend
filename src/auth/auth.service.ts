import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { CodeDTO } from './dto/code-d-t-o'
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { compare, hash } from 'bcrypt';
import { TokenTypeEnum } from '../jwt/enums/token-type.enum';

@Injectable()
export class AuthService {
  constructor(
    private dbService: DbService,
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async create(props: CodeDTO): Promise<any> {
    const { phone_number, name } = props
    let user = await this.usersService.findOneByPhone(phone_number)

    if (!user) {
      user = await this.usersService.create({
        phone_number,
        name,
      })
    }

    const { confirmationToken, confirmationCode } = await this.generateConfirmationToken(user, 'front.nesttestrn.fun')

    // this.mailerService.sendConfirmationEmail(user, confirmationCode);
    return { confirmationToken, confirmationCode };
  }

  public async confirmPhone(
    dto: any,
    domain?: string,
  ): Promise<{refreshToken: string, user: any, accessToken: string}> {
    const { confirmationToken, confirmationCode } = dto
    const { id, code } = await this.jwtService.verifyToken<any>(
        confirmationToken,
        TokenTypeEnum.CONFIRMATION,
    )

    if (!(await compare(confirmationCode.toUpperCase(), code))) {
      throw new BadRequestException('Wrong verification code');
    }

    const user = await this.usersService.confirmPhone(id)

    const [accessToken, refreshToken] =
      await this.jwtService.generateAuthTokens(user, domain)
    return { user, accessToken, refreshToken }
  }

  public async refreshTokenAccess(
    refreshToken: string,
    domain?: string,
  ): Promise<any> {
    const { id, tokenId } = await this.jwtService.verifyToken<any>(
        refreshToken,
        TokenTypeEnum.REFRESH,
      )

    const user = await this.usersService.findOneById(id)
    const [accessToken, newRefreshToken] =
      await this.jwtService.generateAuthTokens(user, domain, tokenId)
    return { user, accessToken, refreshToken: newRefreshToken }
  }

  private async generateConfirmationToken(
    user: any,
    domain: string,
  ): Promise<any> {
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString() //uuidv4().toString().substring(0, 6).toUpperCase();
    console.log(confirmationCode, 'new code')
    const confirmationToken = await this.jwtService.generateToken(
      {
        id: user.id,
        code: await hash(confirmationCode, 10),
      },
      user.name,
      TokenTypeEnum.CONFIRMATION,
      domain,
    )

    return {
      confirmationToken,
      confirmationCode,
    }
  }
}
