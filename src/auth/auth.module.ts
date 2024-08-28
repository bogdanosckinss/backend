import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { DbModule } from '../db/db.module'
import { DbService } from '../db/db.service'
import { UsersModule } from '../users/users.module';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [DbModule, UsersModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService, DbService],
})
export class AuthModule {}
