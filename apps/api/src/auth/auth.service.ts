import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt-access.strategy';
import { AuthUserDto, AuthTokensDto, TokenPairDto } from './dto/auth-response.dto';

const REFRESH_BYTES = 32;

@Injectable()
export class AuthService {
  private readonly bcryptRounds: number;
  private readonly refreshExpiresInMs: number;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.bcryptRounds = this.configService.get<number>('bcrypt.rounds') ?? 12;
    this.refreshExpiresInMs = this.parseDurationToMs(
      this.configService.get<string>('refreshToken.expiresIn') ?? '7d',
    );
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUserDto; tokens: AuthTokensDto }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: UserRole.GUEST,
        isHost: false,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.isHost);
    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUserDto; tokens: AuthTokensDto }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.dummyCompare(dto.password);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.isHost);
    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPairDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokenHash = this.hashToken(refreshToken);

    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (existing.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const newTokens = await this.issueTokens(
      existing.user.id,
      existing.user.email,
      existing.user.role,
      existing.user.isHost,
    );

    const newTokenHash = this.hashToken(newTokens.refreshToken);
    const newTokenRow = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: newTokenHash },
    });
    if (!newTokenRow) {
      throw new UnauthorizedException('Failed to rotate refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: {
        revokedAt: new Date(),
        replacedBy: newTokenRow.id,
      },
    });

    return { tokens: newTokens };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    if (!refreshToken) {
      return { message: 'Logged out' };
    }
    const tokenHash = this.hashToken(refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (existing && !existing.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Logged out' };
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toAuthUser(user);
  }

  /**
   * Grant host capability to an authenticated GUEST.
   *
   * - Idempotent: if the user already has host capability, returns the current
   *   state unchanged.
   * - Never changes `role` (remains GUEST) and never grants ADMIN.
   * - Issues a fresh token pair so the caller's session reflects the new state
   *   without requiring a manual logout/login.
   */
  async becomeHost(userId: string): Promise<{ user: AuthUserDto; tokens: AuthTokensDto }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.role !== UserRole.GUEST) {
      throw new ForbiddenException('Only guest accounts can become hosts');
    }
    if (user.isHost) {
      const tokens = await this.issueTokens(user.id, user.email, user.role, user.isHost);
      return { user: this.toAuthUser(user), tokens };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isHost: true },
    });

    const tokens = await this.issueTokens(
      updated.id,
      updated.email,
      updated.role,
      updated.isHost,
    );
    return { user: this.toAuthUser(updated), tokens };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    isHost: boolean,
  ): Promise<AuthTokensDto> {
    const payload: JwtPayload = { sub: userId, email, role, isHost };
    const accessToken = await this.jwtService.signAsync(payload);

    const rawRefreshToken = crypto.randomBytes(REFRESH_BYTES).toString('base64url');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + this.refreshExpiresInMs);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private toAuthUser(user: User): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isHost: user.isHost,
      createdAt: user.createdAt,
    };
  }

  private async dummyCompare(password: string): Promise<void> {
    const dummyHash = await bcrypt.hash('dummy', this.bcryptRounds);
    await bcrypt.compare(password, dummyHash);
  }

  private parseDurationToMs(value: string): number {
    const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return amount * 1000;
      case 'm': return amount * 60 * 1000;
      case 'h': return amount * 60 * 60 * 1000;
      case 'd': return amount * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}