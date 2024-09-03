import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { DbModule } from '../db/db.module'
import { DbService } from '../db/db.service'
import { UsersModule } from '../users/users.module';
import { JwtModule } from '../jwt/jwt.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [DbModule, UsersModule, JwtModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, DbService, ConfigService],
})
export class AuthModule {}
