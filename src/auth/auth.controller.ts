import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator';
import { FastifyReply, FastifyRequest } from 'fastify';
import { isNull, isUndefined } from '../common/utils/validation.util';
import { Origin } from './decorators/origin.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import process from 'node:process';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Public()
  @Post('/create')
  async create(
    @Body() props: any,
  ): Promise<any> {
    return this.authService.create({ ...props })
  }

  @Public()
  @Delete('/logout')
  async logout(
    @CurrentUser() id: number,
    @Res({passthrough: true}) res: FastifyReply,
  ) {
    if (!id) {
      throw new BadRequestException
    }

    return res.clearCookie('rf').send()
  }

  @Public()
  @Post('/confirm-phone')
  async confirmPhone(
    @Body() props: any,
    @Res({passthrough: true}) res: any,
  ): Promise<any> {
    const result = await this.authService.confirmPhone({ ...props })
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(result);
  }

  @Public()
  @Post('/refresh-access')
  async refreshAccess(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<any> {
    const token = this.refreshTokenFromReq(req)
    const result = await this.authService.refreshTokenAccess(
      token,
      req.headers.origin,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(result)
  }



  private refreshTokenFromReq(req: FastifyRequest): string {
    const token: string | undefined = req.cookies['rf'];

    if (isUndefined(token) || isNull(token)) {
      throw new UnauthorizedException();
    }

    const { valid, value } = req.unsignCookie(token);
    console.log(valid, 'value')

    if (!valid) {
      throw new UnauthorizedException();
    }

    return value;
  }

  private saveRefreshCookie(
    res: FastifyReply,
    refreshToken: string,
  ): any {
    return res
      .cookie('rf', refreshToken, {
        secure: false,
        httpOnly: true,
        sameSite: 'none',
        signed: true,
        path: '/',
        expires: new Date(Date.now() + 60000 * 5000),
      })
      .header('Content-Type', 'application/json');
  }
}
