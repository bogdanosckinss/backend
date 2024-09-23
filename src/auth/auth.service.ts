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
import { CodeDTOViaEmail } from './dto/code-d-t-o-via-email';

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
    const { phone, name } = props
    let user = await this.usersService.findOneByPhone(phone)

    if (!user) {
      user = await this.usersService.create({
        phone_number: phone,
        name,
      })
    }

    const { confirmationToken, confirmationCode } = await this.generateConfirmationToken(user, this.configService.get('frontendDomain'))
    const trimmedPhone = phone.split('+')[1]

    if (!this.configService.get('isDev')) {
      axios.post('https://api.exolve.ru/messaging/v1/SendSMS', {
          number: '79842698582',
          destination: trimmedPhone,
          text: 'Конкурс Талантов «Детский мир» | код для подтверждения: ' + confirmationCode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.configService.get('phoneAccessToken')
          }
        })
    }

    return { confirmationToken, confirmationCode };
  }


  async createViaEmail(props: CodeDTOViaEmail): Promise<any> {
    const { email, name } = props
    let user = await this.usersService.findOneByEmail(email)

    if (!user) {
      user = await this.usersService.createViaEmail({
        email: email,
        name,
      })
    }

    const { confirmationToken, confirmationCode } = await this.generateConfirmationToken(user, this.configService.get('frontendDomain'))

    axios.post('https://api.notisend.ru/v1/email/messages', {
        "from_email": this.configService.get('mailAddress'),
        "from_name": "Звезды будущего",
        "to": email,
        "subject": "Код для подтверждения аккаунта",
        "text": "Ваш код для подтверждения аккаунта на сайте Звезды будущего",
        "html": "<h1>Ваш код для подтверждения аккаунта: "  + confirmationCode + "</h1>"
      },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('mailBearer')}`
          }
        }).then((res) => {
        console.log('done')
      }).catch((e) => {
        console.log(e)
      })

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

    if (!user) {
      throw Error('Not found')
    }

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
