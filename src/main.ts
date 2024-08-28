import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyCors from '@fastify/cors';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )

  app.register(fastifyCookie, {
    secret: 'random_string'
  });
  app.register(fastifyHelmet);
  app.register(fastifyCsrfProtection, { cookieOpts: { signed: true } });
  app.register(fastifyCors, {
    credentials: true,
    origin: `http://localhost:3001`,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  // const app = await NestFactory.create<NestFastifyApplication>(
  //   AppModule,
  //   new FastifyAdapter({ maxParamLength: 1000 }),
  // );

  //  app.enableCors({
  //    credentials: true,
  //    origin: 'http:/localhost:3001'
  //  })
  // app.use(cookieParser('random_string'))

  // app.register(fastifyCookie, {
  //   secret: 'random_string',
  // });
  // app.register(fastifyHelmet);
  // app.register(fastifyCsrfProtection, { cookieOpts: { signed: true } });
  // app.register(fastifyCors, {
  //   credentials: true,
  //   origin: `http://localhost:3000`,
  // });
  await app.listen(3000);
}
bootstrap();
