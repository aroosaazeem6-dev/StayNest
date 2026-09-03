import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.expiresIn') ?? '15m';
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as unknown as number,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const isTest =
          process.env.NODE_ENV === 'test' ||
          process.env.DISABLE_AUTH_THROTTLE === '1';
        return [
          {
            ttl: 60_000,
            limit: isTest ? 100_000 : 20,
          },
        ];
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}