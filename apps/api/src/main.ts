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

  // CORS: configurable via the CORS_ORIGIN environment variable
  // (comma-separated list of allowed origins, e.g.
  // "http://localhost:3000,http://localhost:3001,http://localhost:3002").
  // credentials: true is preserved, so the wildcard "*" is intentionally
  // avoided — browsers reject wildcard origins when credentials are enabled.
  //
  // When CORS_ORIGIN is unset we fall back to a development default that
  // covers the common local Next.js dev ports (3001/3002). This keeps the
  // dev workflow working when the frontend port shifts, without hardcoding a
  // single port and without ever using a wildcard. In production, CORS_ORIGIN
  // MUST be set explicitly (the fallback is only used in development/test).
  const corsOriginRaw = configService.get<string>('CORS_ORIGIN');
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const corsOrigin = corsOriginRaw
    ? corsOriginRaw.split(',').map((o) => o.trim()).filter(Boolean)
    : nodeEnv === 'production'
      ? []
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
        ];
  app.enableCors({
    origin: corsOrigin,
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
    .setDescription('StayNest REST API')
    .setVersion('4.0')
    .addBearerAuth()
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