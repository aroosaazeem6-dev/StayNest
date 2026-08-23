import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MinioService } from '../minio/minio.service';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly minio: MinioService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Full health check' })
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

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  @HttpCode(HttpStatus.OK)
  live(): { status: string; timestamp: string } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Dependencies are ready' })
  @ApiResponse({ status: 503, description: 'Dependencies unavailable' })
  @HttpCode(HttpStatus.OK)
  async ready(): Promise<{
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

    if (!dbHealthy || !redisHealthy || !minioHealthy) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealthy ? 'connected' : 'disconnected',
          redis: redisHealthy ? 'connected' : 'disconnected',
          minio: minioHealthy ? 'connected' : 'disconnected',
        },
      });
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
        minio: minioHealthy ? 'connected' : 'disconnected',
      },
    };
  }
}