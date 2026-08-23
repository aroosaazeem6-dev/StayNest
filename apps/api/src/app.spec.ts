import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { MinioService } from './minio/minio.service';

describe('AppModule', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'test';
    process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'test';
    process.env.MINIO_BUCKET = process.env.MINIO_BUCKET || 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
    process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn(), isHealthy: jest.fn().mockResolvedValue(true) })
      .overrideProvider(RedisService)
      .useValue({ isHealthy: jest.fn().mockResolvedValue(true), getClient: jest.fn() })
      .overrideProvider(MinioService)
      .useValue({ isHealthy: jest.fn().mockResolvedValue(true), getClient: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should have ConfigService globally available', () => {
    const configService = app.get(ConfigService);
    expect(configService).toBeDefined();
    expect(configService.get('port')).toBeDefined();
  });
});