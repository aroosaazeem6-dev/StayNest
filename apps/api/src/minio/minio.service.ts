import {
  Injectable,
  OnModuleInit,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('minio.bucket')!;

    const endpointUrl = this.configService.get<string>('minio.endpoint')!;
    const parsed = new URL(endpointUrl);

    this.client = new Minio.Client({
      endPoint: parsed.hostname,
      port: this.configService.get<number>('minio.port'),
      useSSL: false,
      accessKey: this.configService.get<string>('minio.accessKey') ?? '',
      secretKey: this.configService.get<string>('minio.secretKey') ?? '',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
    this.logger.log(`MinIO connected, bucket: ${this.bucket}`);
  }

  getClient(): Minio.Client {
    return this.client;
  }

  async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Bucket created: ${this.bucket}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      return exists;
    } catch {
      return false;
    }
  }
}