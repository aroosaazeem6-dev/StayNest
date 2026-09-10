import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteService } from './favorite.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

type MockPrismaService = {
  property: { findUnique: jest.Mock };
  favorite: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('FavoriteService', () => {
  let service: FavoriteService;
  let prisma: MockPrismaService;

  const guestUser: AuthenticatedUser = { id: 'guest-1', email: 'g@test.com', role: UserRole.GUEST };

  const mockProperty = { id: 'prop-1', title: 'Test Property', propertyType: 'APARTMENT' as any, city: 'Denver', country: 'USA' };

  const mockFavorite = {
    id: 'fav-1', guestId: 'guest-1', propertyId: 'prop-1', createdAt: new Date(),
    property: mockProperty,
  };

  beforeEach(async () => {
    prisma = {
      property: { findUnique: jest.fn() },
      favorite: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((cbOrArray: any) =>
        Array.isArray(cbOrArray) ? Promise.all(cbOrArray) : cbOrArray(prisma),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoriteService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
  });

  describe('add', () => {
    it('creates a favorite for an existing property', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await service.add(guestUser, 'prop-1');
      expect(result.id).toBe('fav-1');
      expect(prisma.favorite.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { guestId: 'guest-1', propertyId: 'prop-1' } }),
      );
    });

    it('rejects when property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);
      await expect(service.add(guestUser, 'prop-x')).rejects.toThrow(NotFoundException);
    });

    it('rejects duplicate favorite with ConflictException', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      const err = { code: 'P2002' };
      prisma.favorite.create.mockRejectedValue(err);
      await expect(service.add(guestUser, 'prop-1')).rejects.toThrow(ConflictException);
    });

    it('response does not expose sensitive fields', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.favorite.create.mockResolvedValue(mockFavorite);

      const result = await service.add(guestUser, 'prop-1');
      const json = JSON.stringify(result);
      expect(json).not.toContain('password');
      expect(json).not.toContain('passwordHash');
      expect(json).not.toContain('refreshToken');
      expect(json).not.toContain('hostId');
      expect(json).not.toContain('pricePerNight');
    });
  });

  describe('remove', () => {
    it('removes the authenticated guest\'s favorite', async () => {
      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      prisma.favorite.delete.mockResolvedValue(mockFavorite);

      const result = await service.remove(guestUser, 'prop-1');
      expect(result.message).toBe('Favorite removed');
      expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 'fav-1' } });
    });

    it('rejects when favorite does not exist', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);
      await expect(service.remove(guestUser, 'prop-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isFavorited', () => {
    it('returns true when favorited', async () => {
      prisma.favorite.findUnique.mockResolvedValue(mockFavorite);
      const result = await service.isFavorited(guestUser, 'prop-1');
      expect(result.favorited).toBe(true);
    });

    it('returns false when not favorited', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);
      const result = await service.isFavorited(guestUser, 'prop-1');
      expect(result.favorited).toBe(false);
    });
  });

  describe('findMine', () => {
    it('returns only the current guest\'s favorites, newest-first, paginated', async () => {
      prisma.favorite.findMany.mockResolvedValue([mockFavorite]);
      prisma.favorite.count.mockResolvedValue(1);

      const result = await service.findMine(guestUser, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { guestId: 'guest-1' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
    });
  });
});