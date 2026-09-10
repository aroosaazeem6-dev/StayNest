import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingStatus, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

type MockPrismaService = {
  property: { findUnique: jest.Mock };
  booking: { findUnique: jest.Mock };
  review: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; count: jest.Mock };
  $transaction: jest.Mock;
};

describe('ReviewService', () => {
  let service: ReviewService;
  let prisma: MockPrismaService;

  const guestUser: AuthenticatedUser = { id: 'guest-1', email: 'g@test.com', role: UserRole.GUEST };

  const mockProperty = { id: 'prop-1', title: 'Test Property', propertyType: 'APARTMENT' as any, city: 'Denver', country: 'USA' };

  const completedBooking = {
    id: 'bk-1', propertyId: 'prop-1', guestId: 'guest-1', status: BookingStatus.COMPLETED,
  };
  const pendingBooking = { id: 'bk-2', propertyId: 'prop-1', guestId: 'guest-1', status: BookingStatus.PENDING };
  const otherPropertyBooking = { id: 'bk-3', propertyId: 'prop-2', guestId: 'guest-1', status: BookingStatus.COMPLETED };
  const otherGuestBooking = { id: 'bk-4', propertyId: 'prop-1', guestId: 'guest-2', status: BookingStatus.COMPLETED };

  const mockReview = {
    id: 'rev-1', propertyId: 'prop-1', guestId: 'guest-1', bookingId: 'bk-1',
    rating: 5, comment: 'Great!', createdAt: new Date(), updatedAt: new Date(),
    property: mockProperty, guest: { id: 'guest-1', name: 'Guest One' },
  };

  beforeEach(async () => {
    prisma = {
      property: { findUnique: jest.fn() },
      booking: { findUnique: jest.fn() },
      review: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
      $transaction: jest.fn((cbOrArray: any) =>
        Array.isArray(cbOrArray)
          ? Promise.all(cbOrArray)
          : cbOrArray(prisma),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  describe('create', () => {
    it('creates a review for a completed booking by the correct guest', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findUnique.mockResolvedValue(completedBooking);
      prisma.review.create.mockResolvedValue(mockReview);

      const result = await service.create(guestUser, 'prop-1', { bookingId: 'bk-1', rating: 5, comment: 'Great!' });

      expect(result.id).toBe('rev-1');
      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ propertyId: 'prop-1', guestId: 'guest-1', bookingId: 'bk-1', rating: 5 }),
        }),
      );
    });

    it('rejects when property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);
      await expect(service.create(guestUser, 'prop-x', { bookingId: 'bk-1', rating: 5 })).rejects.toThrow(NotFoundException);
    });

    it('rejects when booking does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.create(guestUser, 'prop-1', { bookingId: 'bk-x', rating: 5 })).rejects.toThrow(NotFoundException);
    });

    it('rejects when booking belongs to a different property', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findUnique.mockResolvedValue(otherPropertyBooking);
      await expect(service.create(guestUser, 'prop-1', { bookingId: 'bk-3', rating: 5 })).rejects.toThrow(BadRequestException);
    });

    it('rejects when booking belongs to a different guest', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findUnique.mockResolvedValue(otherGuestBooking);
      await expect(service.create(guestUser, 'prop-1', { bookingId: 'bk-4', rating: 5 })).rejects.toThrow(ForbiddenException);
    });

    it('rejects when booking is not COMPLETED', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findUnique.mockResolvedValue(pendingBooking);
      await expect(service.create(guestUser, 'prop-1', { bookingId: 'bk-2', rating: 5 })).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate review for the same booking', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findUnique.mockResolvedValue(completedBooking);
      const err = { code: 'P2002' };
      prisma.review.create.mockRejectedValue(err);
      await expect(service.create(guestUser, 'prop-1', { bookingId: 'bk-1', rating: 5 })).rejects.toThrow(BadRequestException);
    });

    it('response does not expose sensitive user data', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findUnique.mockResolvedValue(completedBooking);
      prisma.review.create.mockResolvedValue(mockReview);

      const result = await service.create(guestUser, 'prop-1', { bookingId: 'bk-1', rating: 5 });
      const json = JSON.stringify(result);
      expect(json).not.toContain('password');
      expect(json).not.toContain('passwordHash');
      expect(json).not.toContain('refreshToken');
    });
  });

  describe('findByProperty', () => {
    it('returns paginated reviews newest-first', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.review.findMany.mockResolvedValue([mockReview]);
      prisma.review.count.mockResolvedValue(1);

      const result = await service.findByProperty('prop-1', { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' }, skip: 0, take: 10 }),
      );
    });

    it('rejects when property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);
      await expect(service.findByProperty('prop-x', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('returns a review by id', async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);
      const result = await service.findById('rev-1');
      expect(result.id).toBe('rev-1');
    });

    it('rejects when review does not exist', async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(service.findById('rev-x')).rejects.toThrow(NotFoundException);
    });
  });
});