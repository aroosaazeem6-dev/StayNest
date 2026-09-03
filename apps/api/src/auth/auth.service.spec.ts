import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    role: UserRole.GUEST,
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token-123'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'bcrypt.rounds') return 4;
              if (key === 'refreshToken.expiresIn') return '7d';
              return null;
            }),
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('creates a user with GUEST role and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.user.role).toBe(UserRole.GUEST);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.tokens.accessToken).toBe('access-token-123');
      expect(result.tokens.refreshToken).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: UserRole.GUEST }),
        }),
      );
    });

    it('throws ConflictException on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.register({ email: 'test@example.com', password: 'Password123!', name: 'X' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns user + tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 4);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.login({ email: 'test@example.com', password: 'Password123!' });
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access-token-123');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws UnauthorizedException for unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const passwordHash = await bcrypt.hash('DifferentPassword', 4);
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });
      await expect(
        service.login({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rejects an empty token', async () => {
      await expect(service.refresh('')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('a'.repeat(64))).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a revoked token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: 'x',
        expiresAt: new Date(Date.now() + 1_000_000),
        revokedAt: new Date(),
        user: mockUser,
      });
      await expect(service.refresh('a'.repeat(64))).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: 'x',
        expiresAt: new Date(Date.now() - 1_000),
        revokedAt: null,
        user: mockUser,
      });
      await expect(service.refresh('a'.repeat(64))).rejects.toThrow(UnauthorizedException);
    });

    it('rotates a valid token and returns a new pair', async () => {
      prisma.refreshToken.findUnique
        .mockResolvedValueOnce({
          id: 'rt-old',
          userId: 'user-1',
          tokenHash: 'x',
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: null,
          user: mockUser,
        })
        .mockResolvedValueOnce({ id: 'rt-new' });
      prisma.refreshToken.create.mockResolvedValue({ id: 'rt-new' });
      prisma.refreshToken.update.mockResolvedValue({});

      const result = await service.refresh('a'.repeat(64));
      expect(result.tokens.accessToken).toBe('access-token-123');
      expect(result.tokens.refreshToken).toBeDefined();
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-old' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('logout', () => {
    it('revokes the supplied refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: 'x',
        expiresAt: new Date(),
        revokedAt: null,
      });
      prisma.refreshToken.update.mockResolvedValue({});

      const result = await service.logout('a'.repeat(64));
      expect(result.message).toBe('Logged out');
      expect(prisma.refreshToken.update).toHaveBeenCalled();
    });

    it('returns success even if token is already revoked or missing', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      const result = await service.logout('a'.repeat(64));
      expect(result.message).toBe('Logged out');
    });
  });

  describe('me', () => {
    it('returns the user without passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.me('user-1');
      expect(result.id).toBe('user-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.me('missing')).rejects.toThrow(UnauthorizedException);
    });
  });
});