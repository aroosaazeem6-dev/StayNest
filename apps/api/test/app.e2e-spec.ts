import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { HealthModule } from '../src/health/health.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { MinioService } from '../src/minio/minio.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { envValidationSchema } from '../src/config/env.validation';

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'test';
    process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'test';
    process.env.MINIO_BUCKET = process.env.MINIO_BUCKET || 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-32-chars-or-longer-pad';
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
    process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema: envValidationSchema,
        }),
        HealthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({ isHealthy: jest.fn().mockResolvedValue(true) })
      .overrideProvider(RedisService)
      .useValue({ isHealthy: jest.fn().mockResolvedValue(true) })
      .overrideProvider(MinioService)
      .useValue({ isHealthy: jest.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return 200 with all services connected', async () => {
      const response = await request(app.getHttpServer()).get('/health');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.status).toBe('ok');
      expect(response.body.checks.database).toBe('connected');
      expect(response.body.checks.redis).toBe('connected');
      expect(response.body.checks.minio).toBe('connected');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 with alive status', async () => {
      const response = await request(app.getHttpServer()).get('/health/live');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.status).toBe('alive');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 with ready status when all services are up', async () => {
      const response = await request(app.getHttpServer()).get('/health/ready');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.status).toBe('ready');
      expect(response.body.checks.database).toBe('connected');
    });

    it('should return 503 when dependencies are unavailable', async () => {
      const prismaService = app.get(PrismaService);
      jest.spyOn(prismaService, 'isHealthy').mockResolvedValue(false);

      const response = await request(app.getHttpServer()).get('/health/ready');
      expect(response.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
});