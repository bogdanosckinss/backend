import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { CodeDTO } from './dto/code-d-t-o'
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { compare, hash } from 'bcrypt';
import { TokenTypeEnum } from '../jwt/enums/token-type.enum';
import * as process from 'node:process';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private dbService: DbService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  async create(props: CodeDTO): Promise<any> {
    const { email, name } = props
    let user = await this.usersService.findOneByEmail(email)

    if (!user) {
      user = await this.usersService.create({
        email,
        name,
      })
    }

    const { confirmationToken, confirmationCode } = await this.generateConfirmationToken(user, this.configService.get('frontendDomain'))


    axios.post('https://api.notisend.ru/v1/email/messages', {
        "from_email":"ceo@kidsproject.team",
        "from_name": "Звезды будущего",
        "to": "yemeb93944@janfab.com",
        "subject": "Код для подтверждения аккаунта",
        "text": "Ваш код для подтверждения аккаунта на сайте Звезды будущего",
        "html": "<h1>Ваш код для подтверждения аккаунта: "  + confirmationCode + "</h1>"
      },
        {
          headers: {
            Authorization: `Bearer a5cd7b86ed8b29bab61d3ab750fdf8b9`
          }
        }).then((res) => {
        console.log('done')
      }).catch((e) => {
        console.log(e)
      })


    // this.mailerService.sendConfirmationEmail(user, confirmationCode);
    return { confirmationToken, confirmationCode };
  }

  public async testEmail() {
    this.mailerService.sendConfirmationEmail({email: 'bogdanosckinss@gmail.com'}, '1212');
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
