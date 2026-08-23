import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MinioService } from '../minio/minio.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly minio: MinioService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  @HttpCode(HttpStatus.OK)
  async check(): Promise<{
    status: string;
    timestamp: string;
    checks: {
      database: string;
      redis: string;
      minio: string;
    };
  }> {
    const dbHealthy = await this.prisma.isHealthy();
    const redisHealthy = await this.redis.isHealthy();
    const minioHealthy = await this.minio.isHealthy();

    const allHealthy = dbHealthy && redisHealthy && minioHealthy;

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
        minio: minioHealthy ? 'connected' : 'disconnected',
      },
    };
  }
}