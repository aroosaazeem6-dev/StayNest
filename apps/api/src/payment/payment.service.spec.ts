import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  Booking,
  BookingStatus,
  Payment,
  PaymentStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

type MockPrismaService = {
  booking: {
    findUnique: jest.Mock;
  };
  payment: {
    create: jest.Mock;
  };
};

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: MockPrismaService;

  const mockBooking: Booking & { payment: Payment | null } = {
    id: 'bk-1',
    propertyId: 'prop-1',
    guestId: 'guest-1',
    checkIn: new Date('2026-11-01T00:00:00.000Z'),
    checkOut: new Date('2026-11-05T00:00:00.000Z'),
    guests: 2,
    status: BookingStatus.PENDING,
    totalAmount: new Prisma.Decimal(400),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    payment: null,
  };

  const mockPayment: Payment = {
    id: 'pay-1',
    bookingId: 'bk-1',
    amount: new Prisma.Decimal(400),
    currency: 'PKR',
    status: PaymentStatus.PENDING,
    provider: 'JAZZCASH',
    providerReference: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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

  beforeEach(async () => {
    const mockPrisma: MockPrismaService = {
      booking: {
        findUnique: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('create', () => {
    it('creates a payment with correct amount, currency, status, and provider', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.id).toBe('pay-1');
      expect(result.bookingId).toBe('bk-1');
      expect(result.amount).toBe(400);
      expect(result.currency).toBe('PKR');
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.provider).toBe('JAZZCASH');
      expect(result.providerReference).toBeNull();
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'bk-1',
            amount: mockBooking.totalAmount,
            currency: 'PKR',
            status: PaymentStatus.PENDING,
            provider: 'JAZZCASH',
          }),
        }),
      );
    });

    it('uses booking.totalAmount as payment amount (not from request)', async () => {
      const bookingWithDifferentAmount = {
        ...mockBooking,
        totalAmount: new Prisma.Decimal(750.5),
      };
      prisma.booking.findUnique.mockResolvedValue(bookingWithDifferentAmount);
      prisma.payment.create.mockResolvedValue({
        ...mockPayment,
        amount: new Prisma.Decimal(750.5),
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.amount).toBe(750.5);
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: bookingWithDifferentAmount.totalAmount,
          }),
        }),
      );
    });

    it('throws NotFoundException when booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.create(guestUser, { bookingId: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when booking belongs to another guest', async () => {
      const otherGuestBooking = { ...mockBooking, guestId: 'guest-2' };
      prisma.booking.findUnique.mockResolvedValue(otherGuestBooking);

      await expect(service.create(guestUser, { bookingId: 'bk-1' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when user is not a GUEST', async () => {
      await expect(service.create(hostUser, { bookingId: 'bk-1' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when booking is not PENDING', async () => {
      const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
      prisma.booking.findUnique.mockResolvedValue(confirmedBooking);

      await expect(service.create(guestUser, { bookingId: 'bk-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when booking is CANCELLED', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      prisma.booking.findUnique.mockResolvedValue(cancelledBooking);

      await expect(service.create(guestUser, { bookingId: 'bk-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when booking is COMPLETED', async () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.COMPLETED };
      prisma.booking.findUnique.mockResolvedValue(completedBooking);

      await expect(service.create(guestUser, { bookingId: 'bk-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when payment already exists', async () => {
      const bookingWithPayment = {
        ...mockBooking,
        payment: { ...mockPayment, id: 'existing-pay' },
      };
      prisma.booking.findUnique.mockResolvedValue(bookingWithPayment);

      await expect(service.create(guestUser, { bookingId: 'bk-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('initial payment status is PENDING', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('currency is PKR', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.currency).toBe('PKR');
    });

    it('provider is JAZZCASH', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.provider).toBe('JAZZCASH');
    });

    it('providerReference is null initially', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.providerReference).toBeNull();
    });
  });
});