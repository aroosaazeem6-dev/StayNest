import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  Booking,
  BookingStatus,
  Property,
  PropertyStatus,
  UserRole,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

type MockPrismaService = {
  property: {
    findUnique: jest.Mock;
  };
  booking: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('BookingService', () => {
  let service: BookingService;
  let prisma: MockPrismaService;

  const mockProperty: Pick<Property, 'id' | 'status' | 'pricePerNight' | 'maxGuests'> = {
    id: 'prop-1',
    status: PropertyStatus.ACTIVE,
    pricePerNight: new (require('@prisma/client').Prisma.Decimal)(100),
    maxGuests: 4,
  };

  const mockBooking: Booking & {
    property: Pick<Property, 'id' | 'title' | 'propertyType' | 'city' | 'country' | 'pricePerNight' | 'hostId'>;
  } = {
    id: 'bk-1',
    propertyId: 'prop-1',
    guestId: 'guest-1',
    checkIn: new Date('2026-11-01T00:00:00.000Z'),
    checkOut: new Date('2026-11-05T00:00:00.000Z'),
    guests: 2,
    status: BookingStatus.PENDING,
    totalAmount: new (require('@prisma/client').Prisma.Decimal)(400),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    property: {
      id: 'prop-1',
      title: 'Test Property',
      propertyType: 'APARTMENT' as any,
      city: 'Denver',
      country: 'USA',
      pricePerNight: new (require('@prisma/client').Prisma.Decimal)(100),
      hostId: 'host-1',
    },
  };

  const guestUser: AuthenticatedUser = {
    id: 'guest-1',
    email: 'guest@test.com',
    role: UserRole.GUEST,
  };

  const hostUser: AuthenticatedUser = {
    id: 'host-1',
    email: 'host@test.com',
    role: UserRole.HOST,
  };

  const adminUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  };

  const otherGuestUser: AuthenticatedUser = {
    id: 'guest-2',
    email: 'other@test.com',
    role: UserRole.GUEST,
  };

  beforeEach(async () => {
    const mockPrisma: MockPrismaService = {
      property: {
        findUnique: jest.fn(),
      },
      booking: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb({
        booking: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      } as any)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('checkAvailability', () => {
    it('returns available when no overlapping bookings', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findFirst.mockResolvedValue(null);

      const result = await service.checkAvailability('prop-1', {
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
      });

      expect(result.available).toBe(true);
      expect(prisma.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          }),
          select: { id: true },
        }),
      );
    });

    it('returns unavailable for overlapping PENDING booking', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findFirst.mockResolvedValue({ id: 'bk-overlap' });

      const result = await service.checkAvailability('prop-1', {
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
      });

      expect(result.available).toBe(false);
    });

    it('returns unavailable for overlapping CONFIRMED booking', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findFirst.mockResolvedValue({ id: 'bk-confirmed' });

      const result = await service.checkAvailability('prop-1', {
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
      });

      expect(result.available).toBe(false);
    });

    it('ignores CANCELLED booking', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findFirst.mockResolvedValue(null);

      const result = await service.checkAvailability('prop-1', {
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
      });

      expect(result.available).toBe(true);
    });

    it('allows adjacent bookings (checkOut == existing checkIn)', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.booking.findFirst.mockResolvedValue(null);

      const result = await service.checkAvailability('prop-1', {
        checkIn: '2026-11-05',
        checkOut: '2026-11-10',
      });

      expect(result.available).toBe(true);
    });

    it('throws NotFoundException for nonexistent property', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.checkAvailability('nonexistent', {
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for inactive property', async () => {
      prisma.property.findUnique.mockResolvedValue({ ...mockProperty, status: PropertyStatus.DRAFT });

      await expect(
        service.checkAvailability('prop-1', {
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects past checkIn', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastStr = pastDate.toISOString().split('T')[0];

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.checkAvailability('prop-1', {
          checkIn: pastStr,
          checkOut: '2026-11-05',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects checkOut <= checkIn', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.checkAvailability('prop-1', {
          checkIn: '2026-11-05',
          checkOut: '2026-11-05',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('creates a booking with correct total and PENDING status', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          booking: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              ...mockBooking,
              id: 'bk-new',
              status: BookingStatus.PENDING,
              totalAmount: new (require('@prisma/client').Prisma.Decimal)(400),
            }),
          },
        };
        return cb(tx as any);
      });

      const result = await service.create(guestUser, {
        propertyId: 'prop-1',
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
        guests: 2,
      });

      expect(result.id).toBe('bk-new');
      expect(result.status).toBe(BookingStatus.PENDING);
      expect(result.totalAmount).toBe(400);
      expect(result.guests).toBe(2);
    });

    it('calculates correct nights and total', async () => {
      prisma.property.findUnique.mockResolvedValue({
        ...mockProperty,
        pricePerNight: new (require('@prisma/client').Prisma.Decimal)(150),
      });
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          booking: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              ...mockBooking,
              id: 'bk-new',
              totalAmount: new (require('@prisma/client').Prisma.Decimal)(600),
            }),
          },
        };
        return cb(tx as any);
      });

      const result = await service.create(guestUser, {
        propertyId: 'prop-1',
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
        guests: 2,
      });

      expect(result.totalAmount).toBe(600);
    });

    it('rejects when guests exceed maxGuests', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.create(guestUser, {
          propertyId: 'prop-1',
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          guests: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects overlapping booking', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          booking: {
            findFirst: jest.fn().mockResolvedValue({ id: 'bk-overlap' }),
            create: jest.fn(),
          },
        };
        return cb(tx as any);
      });

      await expect(
        service.create(guestUser, {
          propertyId: 'prop-1',
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          guests: 2,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects non-GUEST role', async () => {
      await expect(
        service.create(hostUser, {
          propertyId: 'prop-1',
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          guests: 2,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects past checkIn', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.create(guestUser, {
          propertyId: 'prop-1',
          checkIn: '2020-01-01',
          checkOut: '2020-01-05',
          guests: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects checkOut <= checkIn', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.create(guestUser, {
          propertyId: 'prop-1',
          checkIn: '2026-11-05',
          checkOut: '2026-11-05',
          guests: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects nonexistent property', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.create(guestUser, {
          propertyId: 'nonexistent',
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          guests: 2,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects inactive property', async () => {
      prisma.property.findUnique.mockResolvedValue({ ...mockProperty, status: PropertyStatus.DRAFT });

      await expect(
        service.create(guestUser, {
          propertyId: 'prop-1',
          checkIn: '2026-11-01',
          checkOut: '2026-11-05',
          guests: 2,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMyBookings', () => {
    it('returns only the current guests bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      prisma.booking.count.mockResolvedValue(1);

      const result = await service.findMyBookings(guestUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].guestId).toBe('guest-1');
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { guestId: 'guest-1' },
        }),
      );
    });

    it('supports pagination', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      prisma.booking.count.mockResolvedValue(25);

      const result = await service.findMyBookings(guestUser, 2, 10);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  describe('findOne', () => {
    it('allows guest to view own booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findOne('bk-1', guestUser);

      expect(result.id).toBe('bk-1');
    });

    it('allows host to view booking for their property', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findOne('bk-1', hostUser);

      expect(result.id).toBe('bk-1');
    });

    it('allows admin to view any booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findOne('bk-1', adminUser);

      expect(result.id).toBe('bk-1');
    });

    it('rejects guest viewing another guests booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(service.findOne('bk-1', otherGuestUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects host viewing unrelated property booking', async () => {
      const otherPropertyBooking = {
        ...mockBooking,
        property: { ...mockBooking.property, hostId: 'host-2' },
      };
      prisma.booking.findUnique.mockResolvedValue(otherPropertyBooking);

      await expect(service.findOne('bk-1', hostUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException for nonexistent booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', guestUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('allows guest to cancel own PENDING booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel('bk-1', guestUser);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bk-1' },
          data: { status: BookingStatus.CANCELLED },
        }),
      );
    });

    it('allows host to cancel booking for their property', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel('bk-1', hostUser);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('allows admin to cancel any booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel('bk-1', adminUser);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('rejects cancelling already CANCELLED booking', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      prisma.booking.findUnique.mockResolvedValue(cancelledBooking);

      await expect(service.cancel('bk-1', guestUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cancelling COMPLETED booking', async () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.COMPLETED };
      prisma.booking.findUnique.mockResolvedValue(completedBooking);

      await expect(service.cancel('bk-1', guestUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects guest cancelling another guests booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(service.cancel('bk-1', otherGuestUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException for nonexistent booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.cancel('nonexistent', guestUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
