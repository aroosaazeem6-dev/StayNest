import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // Security: Helmet for HTTP headers
  app.use(helmet());

  // CORS: configurable via environment
  const corsOrigin = configService.get<string>('cors.origin');
  app.enableCors({
    origin: corsOrigin?.split(',') ?? '*',
    credentials: true,
  });

  // API Versioning: URI-based (e.g., /api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Graceful Shutdown
  app.enableShutdownHooks();

  // Swagger / OpenAPI
  const docsConfig = new DocumentBuilder()
    .setTitle('StayNest API')
    .setDescription('StayNest REST API - Backend Foundation (Phase 2)')
    .setVersion('2.0')
    .addServer('/api/v1', 'v1')
    .build();

  const document = SwaggerModule.createDocument(app, docsConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);

  console.log(`StayNest API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`Health: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('Failed to start StayNest API', err);
  process.exit(1);
});