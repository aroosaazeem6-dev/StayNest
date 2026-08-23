import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('redis.url');
    this.client = createClient({ url });
  }

  async onModuleInit(): Promise<void> {
    this.client.on('error', (err) =>
      this.logger.error('Redis client error', err),
    );
    await this.client.connect();
    this.logger.log('Redis connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis disconnected');
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}