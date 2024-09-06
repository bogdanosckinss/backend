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
    const { phone_number, name } = props
    let user = await this.usersService.findOneByPhone(phone_number)

    if (!user) {
      user = await this.usersService.create({
        phone_number,
        name,
      })
    }

    const { confirmationToken, confirmationCode } = await this.generateConfirmationToken(user, this.configService.get('frontendDomain'))


    // axios.post('https://api.exolve.ru/messaging/v1/SendSMS', {
    //       "number": "79842698582",
    //       "destination": phone_number.split('+')[1],
    //       "text": confirmationCode
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJRV05sMENiTXY1SHZSV29CVUpkWjVNQURXSFVDS0NWODRlNGMzbEQtVHA0In0.eyJleHAiOjIwNDA4MjI1OTMsImlhdCI6MTcyNTQ2MjU5MywianRpIjoiZjU2ZTE2ZDAtZWE4ZC00MjBiLTkyMTktOTg5NWM0NTllNjBiIiwiaXNzIjoiaHR0cHM6Ly9zc28uZXhvbHZlLnJ1L3JlYWxtcy9FeG9sdmUiLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiY2Q0YmVhOTEtNmUwOS00MTVlLTljYjYtZTE3YjUwMDc2NTI1IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYTEyNjczMGYtNDgxMC00YjRjLTlmZmUtZjMzMTZkOTIyMDNmIiwic2Vzc2lvbl9zdGF0ZSI6ImZjN2EzMzczLTk2MmYtNDliYi04NzQwLWFlYzI4YjgyMjlhNiIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1leG9sdmUiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJleG9sdmVfYXBwIHByb2ZpbGUgZW1haWwiLCJzaWQiOiJmYzdhMzM3My05NjJmLTQ5YmItODc0MC1hZWMyOGI4MjI5YTYiLCJ1c2VyX3V1aWQiOiJiNzk3OTA0Yi0zOThlLTRlZjYtYWU2NS1iYTZiOTc0ZGE0NTQiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImNsaWVudEhvc3QiOiIxNzIuMjAuMi4yMiIsImNsaWVudElkIjoiYTEyNjczMGYtNDgxMC00YjRjLTlmZmUtZjMzMTZkOTIyMDNmIiwiYXBpX2tleSI6dHJ1ZSwiYXBpZm9uaWNhX3NpZCI6ImExMjY3MzBmLTQ4MTAtNGI0Yy05ZmZlLWYzMzE2ZDkyMjAzZiIsImJpbGxpbmdfbnVtYmVyIjoiMTIzMzk2MiIsImFwaWZvbmljYV90b2tlbiI6ImF1dDFjYmRlYjg4LTU4ODAtNDA2Ny05ZTdjLWZjOTQ2MWZmYjc1OSIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1hMTI2NzMwZi00ODEwLTRiNGMtOWZmZS1mMzMxNmQ5MjIwM2YiLCJjdXN0b21lcl9pZCI6IjQ0OTYzIiwiY2xpZW50QWRkcmVzcyI6IjE3Mi4yMC4yLjIyIn0.T_qjSPsbRcWnEjbiLKVhoL70hmOjbX6o8-wZ3qWkOoA8ez57ILTVwIUcj9-Kw0W33XZbIIMRa0aNAoqd1Jg5h8aTZFjS9gNKpNSLlK8CpvpRWfuPP3tZoN0VsEb4uSJLzFQzIRjyCUtceomIb7gVuLeNWs0W-y2pq7fgbSU3j-TmIBsyEXX-A9uws2sNdJK67HXP_JJzsspDJwmMWikTlgABIvYJbLa8BVQMKKsk23-sZ1voCmB5YILNcu84BVJ83ilwiVBSXNomNLxY8LhqidWA38wUQ8aArPlNwzPVE0_no9xMdAnU54QpZyt4LYg8XhdGMFQYIrEgtwJFUASOaA`
    //       }
    //     }).then((res) => {
    //     console.log(phone_number.split('+')[1], res)
    //   }).catch((e) => {
    //     console.log(e)
    //   })


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
