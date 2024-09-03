import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [JwtService, ConfigService],
  exports: [JwtService],
})
export class JwtModule {}
