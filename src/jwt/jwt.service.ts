import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import { TokenTypeEnum } from './enums/token-type.enum';
import {
  IAccessPayload,
  IAccessToken,
} from './interfaces/access-token.interface';
import {
  IEmailToken,
  IEmailPayload,
} from './interfaces/email-confirm-token.interface';
import {
  IRefreshPayload,
  IRefreshToken,
} from './interfaces/refresh-token.interface';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class JwtService {
  private readonly jwtConfig: any;
  private readonly issuer: string;
  private readonly domain: string;

  constructor(
  ) {
    const publicKey = readFileSync(
      join(__dirname, '..', '..', 'keys/public.key'),
      'utf-8',
    );
    const privateKey = readFileSync(
      join(__dirname, '..', '..', 'keys/private.key'),
      'utf-8',
    );
    this.jwtConfig = {
      access: {
        privateKey,
        publicKey,
        time: parseInt(process.env.JWT_ACCESS_TIME, 10),
      },
      confirmation: {
        secret: 'random_string',
        time: parseInt(process.env.JWT_CONFIRMATION_TIME, 10),
      },
      resetPassword: {
        secret: 'random_string',
        time: parseInt(process.env.JWT_RESET_PASSWORD_TIME, 10),
      },
      refresh: {
        secret: 'random_string',
        time: parseInt(process.env.JWT_REFRESH_TIME, 10),
      },
    },
    this.issuer = 'a32d05c3-063b-498c-9fda-48e86f69167a'
    this.domain = 'localhost:3001'
  }

  private static async generateTokenAsync(
    payload: IAccessPayload | IEmailPayload | IRefreshPayload | object,
    secret: string,
    options: jwt.SignOptions,
  ): Promise<string> {
    return new Promise((resolve, rejects) => {
      jwt.sign(payload, secret, options, (error, token) => {
        if (error) {
          rejects(error);
          return;
        }
        resolve(token);
      });
    });
  }

  private static async verifyTokenAsync<T>(
    token: string,
    secret: string,
    options: jwt.VerifyOptions,
  ): Promise<T> {
    return new Promise((resolve, rejects) => {
      jwt.verify(token, secret, options, (error, payload: T) => {
        if (error) {
          rejects(error);
          return;
        }
        resolve(payload);
      });
    });
  }

  private static async throwBadRequest<
    T extends IAccessToken | IRefreshToken | IEmailToken,
  >(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestException('Invalid token');
      }
      throw new InternalServerErrorException(error);
    }
  }

  public async generateToken(
      payload: Object,
      subject: string,
      tokenType: TokenTypeEnum,
      domain?:string
  ): Promise<string> {
    const jwtOptions: jwt.SignOptions = {
      issuer: this.issuer,
      subject: subject,
      audience: domain ?? this.domain,
      algorithm: 'HS256',
    }

    switch (tokenType) {
      case TokenTypeEnum.ACCESS:
        const { privateKey, time: accessTime } = this.jwtConfig.access;
        return await JwtService.generateTokenAsync(payload, privateKey, {
          ...jwtOptions,
          expiresIn: accessTime,
          algorithm: 'RS256',
        })
      case TokenTypeEnum.REFRESH:
        const { secret: refreshSecret, time: refreshTime } =
            this.jwtConfig.refresh;
        return await JwtService.generateTokenAsync(
          payload,
          refreshSecret,
          {
            ...jwtOptions,
            expiresIn: refreshTime,
          },
        )
      case TokenTypeEnum.CONFIRMATION:
        const { secret: secretKey, time: timeConfirmation } =
            this.jwtConfig.confirmation;
        return await JwtService.generateTokenAsync(
          payload,
          secretKey,
          {
            ...jwtOptions,
            expiresIn: timeConfirmation,
          },
        )
    }
  }

  public async verifyToken<
    T extends IAccessToken | IRefreshToken | IEmailToken,
  >(token: string, tokenType: TokenTypeEnum): Promise<T> {
    const jwtOptions: jwt.VerifyOptions = {
      issuer: this.issuer,
      audience: new RegExp(this.domain),
    };

    switch (tokenType) {
      case TokenTypeEnum.ACCESS:
        const { publicKey, time: accessTime } = this.jwtConfig.access;
        return JwtService.throwBadRequest(
          JwtService.verifyTokenAsync(token, publicKey, {
            ...jwtOptions,
            maxAge: accessTime,
            algorithms: ['RS256'],
          }),
        );
      case TokenTypeEnum.REFRESH:
      case TokenTypeEnum.CONFIRMATION:
        const { secret, time } = this.jwtConfig[tokenType];
        return JwtService.throwBadRequest(
          JwtService.verifyTokenAsync(token, secret, {
            ...jwtOptions,
            maxAge: time,
            algorithms: ['HS256'],
          }),
        );
    }
  }

  public async generateAuthTokens(
    user: any,
    domain?: string,
    tokenId?: string,
  ): Promise<[string, string]> {
    return Promise.all([
      this.generateToken({ id: user.id }, user.name, TokenTypeEnum.ACCESS, domain),
      this.generateToken({
          id: user.id,
          tokenId: tokenId ?? v4(),
      }, user.name, TokenTypeEnum.REFRESH, domain),
    ]);
  }
}
