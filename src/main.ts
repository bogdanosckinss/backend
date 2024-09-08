import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyCors from '@fastify/cors';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fastifyMultipart from '@fastify/multipart';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )

  const configService = app.get(ConfigService)
  app.register(fastifyMultipart, {
    throwFileSizeLimit: false,
    limits: {
      files: 1,
      fileSize: 100000,
    },
  })
  app.register(fastifyCookie, {
    secret: 'random_string'
  });
  app.register(fastifyHelmet);
  app.register(fastifyCsrfProtection, { cookieOpts: { signed: true } });
  app.register(fastifyCors, {
    credentials: true,
    origin: [configService.get('frontendUrl'), 'http://localhost:5173'],
    methods: 'GET,POST,PUT,DELETE,OPTIONS'
  });
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true,
  //   }),
  // );

  await app.listen(3000);
}
bootstrap();
