import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole, PaymentStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

type MockPrismaService = {
    $transaction: jest.Mock;
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    property: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    booking: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    payment: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    review: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    favorite: { count: jest.Mock };
  };

describe('AdminService', () => {
  let service: AdminService;
  let prisma: MockPrismaService;

  const adminUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  };

  const mockUsers = [
    {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@test.com',
      role: UserRole.GUEST,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'user-2',
      name: 'Bob',
      email: 'bob@test.com',
      role: UserRole.HOST,
      createdAt: new Date('2026-01-02'),
      updatedAt: new Date('2026-01-02'),
    },
  ];

  const mockProperties = [
    {
      id: 'prop-1',
      title: 'Mountain View',
      city: 'Aspen',
      country: 'USA',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      host: { id: 'user-2', name: 'Bob' },
    },
    {
      id: 'prop-2',
      title: 'Beach House',
      city: 'Miami',
      country: 'USA',
      status: 'DRAFT',
      createdAt: new Date('2026-01-02'),
      updatedAt: new Date('2026-01-02'),
      host: { id: 'user-2', name: 'Bob' },
    },
  ];

  const mockBookings = [
    {
      id: 'bk-1',
      propertyId: 'prop-1',
      guestId: 'user-1',
      checkIn: new Date('2026-02-01'),
      checkOut: new Date('2026-02-05'),
      guests: 2,
      status: 'PENDING',
      totalAmount: 1000,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      property: {
        id: 'prop-1',
        title: 'Mountain View',
        propertyType: 'APARTMENT',
        city: 'Aspen',
        country: 'USA',
        pricePerNight: 250,
        hostId: 'user-2',
      },
      guest: { id: 'user-1', name: 'Alice' },
    },
    {
      id: 'bk-2',
      propertyId: 'prop-2',
      guestId: 'user-2',
      checkIn: new Date('2026-03-01'),
      checkOut: new Date('2026-03-05'),
      guests: 4,
      status: 'CONFIRMED',
      totalAmount: 2000,
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      property: {
        id: 'prop-2',
        title: 'Beach House',
        propertyType: 'HOUSE',
        city: 'Miami',
        country: 'USA',
        pricePerNight: 500,
        hostId: 'user-2',
      },
      guest: { id: 'user-2', name: 'Bob' },
    },
  ];

  const mockPayments = [
    {
      id: 'pay-1',
      bookingId: 'bk-1',
      provider: 'JAZZCASH',
      providerReference: 'ref-1',
      amount: 1000,
      currency: 'PKR',
      status: 'PENDING',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      booking: {
        id: 'bk-1',
        guestId: 'user-1',
        propertyId: 'prop-1',
        status: 'PENDING',
      },
    },
    {
      id: 'pay-2',
      bookingId: 'bk-2',
      provider: 'JAZZCASH',
      providerReference: 'ref-2',
      amount: 2000,
      currency: 'PKR',
      status: 'SUCCEEDED',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      booking: {
        id: 'bk-2',
        guestId: 'user-2',
        propertyId: 'prop-2',
        status: 'CONFIRMED',
      },
    },
  ];

  const mockRecentBookings = [
    {
      id: 'bk-1',
      propertyId: 'prop-1',
      guestId: 'user-1',
      status: 'PENDING',
      checkIn: new Date('2026-02-01'),
      checkOut: new Date('2026-02-05'),
      totalAmount: 1000,
      createdAt: new Date('2026-01-15'),
    },
    {
      id: 'bk-2',
      propertyId: 'prop-2',
      guestId: 'user-2',
      status: 'CONFIRMED',
      checkIn: new Date('2026-03-01'),
      checkOut: new Date('2026-03-05'),
      totalAmount: 2000,
      createdAt: new Date('2026-01-20'),
    },
  ];

  const mockRecentPayments = [
    {
      id: 'pay-1',
      bookingId: 'bk-1',
      provider: 'JAZZCASH',
      providerReference: 'ref-1',
      amount: 1000,
      currency: 'PKR',
      status: 'PENDING',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      booking: {
        id: 'bk-1',
        guestId: 'user-1',
        propertyId: 'prop-1',
        status: 'PENDING',
      },
    },
    {
      id: 'pay-2',
      bookingId: 'bk-2',
      provider: 'JAZZCASH',
      providerReference: 'ref-2',
      amount: 2000,
      currency: 'PKR',
      status: 'SUCCEEDED',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      booking: {
        id: 'bk-2',
        guestId: 'user-2',
        propertyId: 'prop-2',
        status: 'CONFIRMED',
      },
    },
  ];

  const mockRecentReviews: any[] = [];

beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation(async (ops: any[]) => Promise.all(ops)),
      user: {
        count: jest.fn().mockResolvedValue(mockUsers.length),
        findMany: jest.fn().mockResolvedValue(mockUsers),
        findUnique: jest.fn().mockResolvedValue(mockUsers[0]),
        update: jest.fn().mockResolvedValue({ ...mockUsers[0], role: UserRole.HOST }),
      },
      property: {
        count: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.status === 'DRAFT') return Promise.resolve(1);
          if (args?.where?.status === 'ACTIVE') return Promise.resolve(1);
          if (args?.where?.status === 'ARCHIVED') return Promise.resolve(0);
          return Promise.resolve(mockProperties.length);
        }),
        findMany: jest.fn().mockResolvedValue(mockProperties),
        findUnique: jest.fn().mockResolvedValue(mockProperties[0]),
        update: jest.fn().mockResolvedValue({ ...mockProperties[0], status: 'ARCHIVED' }),
      },
      booking: {
        count: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.status === 'PENDING') return Promise.resolve(1);
          if (args?.where?.status === 'CONFIRMED') return Promise.resolve(1);
          if (args?.where?.status === 'CANCELLED') return Promise.resolve(0);
          if (args?.where?.status === 'COMPLETED') return Promise.resolve(0);
          return Promise.resolve(mockBookings.length);
        }),
        findMany: jest.fn().mockResolvedValue(mockBookings),
        findUnique: jest.fn().mockResolvedValue(mockBookings[0]),
        update: jest.fn().mockResolvedValue({ ...mockBookings[0], status: 'CANCELLED' }),
      },
      payment: {
        count: jest.fn().mockImplementation((args: any) => {
          if (args?.where?.status === 'PENDING') return Promise.resolve(1);
          if (args?.where?.status === 'SUCCEEDED') return Promise.resolve(1);
          if (args?.where?.status === 'FAILED') return Promise.resolve(0);
          if (args?.where?.status === 'REFUNDED') return Promise.resolve(0);
          return Promise.resolve(mockPayments.length);
        }),
        findMany: jest.fn().mockResolvedValue(mockRecentPayments),
        findUnique: jest.fn().mockResolvedValue(mockPayments[0]),
        update: jest.fn().mockResolvedValue({ ...mockPayments[0], status: 'FAILED' }),
      },
      review: {
        count: jest.fn().mockResolvedValue(mockRecentReviews.length),
        findMany: jest.fn().mockResolvedValue(mockRecentReviews),
      },
      favorite: { count: jest.fn().mockResolvedValue(0) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  // ---- Step 1: dashboard ----
  it('dashboard overview still works', async () => {
    const result = await service.getDashboardOverview();
    expect(result.users).toBe(mockUsers.length);
    expect(result.properties).toBe(mockProperties.length);
    expect(result.bookings.total).toBe(mockBookings.length);
    expect(result.bookings.hostAccepted).toBeDefined();
    expect(result.bookings.hostDeclined).toBeDefined();
  });

  it('property status counts are correct', async () => {
    const result = await service.getDashboardOverview();
    expect(result.propertyStatuses).toBeDefined();
    expect(result.propertyStatuses.draft).toBe(1);
    expect(result.propertyStatuses.active).toBe(1);
    expect(result.propertyStatuses.archived).toBe(0);
    expect(result.propertyStatuses.draft + result.propertyStatuses.active + result.propertyStatuses.archived).toBe(result.properties);
  });

  it('recent activity is limited to 5 entries', async () => {
    prisma.booking.findMany.mockResolvedValue(mockRecentBookings);
    prisma.payment.findMany.mockResolvedValue(mockRecentPayments);
    prisma.review.findMany.mockResolvedValue(mockRecentReviews);

    const result = await service.getDashboardOverview();
    expect(result.recentActivity.recentBookings.length).toBeLessThanOrEqual(5);
    expect(result.recentActivity.recentPayments.length).toBeLessThanOrEqual(5);
    expect(result.recentActivity.recentReviews.length).toBeLessThanOrEqual(5);

    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it('recent activity contains only safe fields', async () => {
    const result = await service.getDashboardOverview();
    const json = JSON.stringify(result.recentActivity);
    expect(json).not.toContain('passwordHash');
    expect(json).not.toContain('refreshToken');
    expect(json).not.toContain('accessToken');
    expect(json).not.toContain('merchantPassword');
    expect(json).not.toContain('integritySalt');
    expect(json).not.toContain('providerReference');
  });

  it('recent bookings contain expected fields', async () => {
    const result = await service.getDashboardOverview();
    const first = result.recentActivity.recentBookings[0];
    expect(first.id).toBe('bk-1');
    expect(first.propertyId).toBe('prop-1');
    expect(first.guestId).toBe('user-1');
    expect(first.status).toBe('PENDING');
    expect(first.totalAmount).toBe(1000);
    expect(first.createdAt).toBeDefined();
    expect(first.checkIn).toBeDefined();
    expect(first.checkOut).toBeDefined();
  });

  it('recent payments contain expected fields', async () => {
    const result = await service.getDashboardOverview();
    const first = result.recentActivity.recentPayments[0];
    expect(first.id).toBe('pay-1');
    expect(first.bookingId).toBe('bk-1');
    expect(first.provider).toBe('JAZZCASH');
    expect(first.amount).toBe(1000);
    expect(first.currency).toBe('PKR');
    expect(first.status).toBe('PENDING');
    expect(first.createdAt).toBeDefined();
  });

  it('empty database works correctly', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.property.count.mockResolvedValue(0);
    prisma.booking.count.mockResolvedValue(0);
    prisma.payment.count.mockResolvedValue(0);
    prisma.review.count.mockResolvedValue(0);
    prisma.favorite.count.mockResolvedValue(0);
    prisma.booking.findMany.mockResolvedValue([]);
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.review.findMany.mockResolvedValue([]);

    const result = await service.getDashboardOverview();
    expect(result.users).toBe(0);
    expect(result.properties).toBe(0);
    expect(result.propertyStatuses.draft).toBe(0);
    expect(result.propertyStatuses.active).toBe(0);
    expect(result.propertyStatuses.archived).toBe(0);
    expect(result.bookings.total).toBe(0);
    expect(result.payments.total).toBe(0);
    expect(result.reviews).toBe(0);
    expect(result.favorites).toBe(0);
    expect(result.recentActivity.recentBookings).toEqual([]);
    expect(result.recentActivity.recentPayments).toEqual([]);
    expect(result.recentActivity.recentReviews).toEqual([]);
  });

  // ---- Step 2: user management ----
  it('lists users successfully', async () => {
    const result = await service.listUsers({});
    expect(result.data).toHaveLength(mockUsers.length);
  });

  it('get existing user', async () => {
    const result = await service.getUser('user-1');
    expect(result.id).toBe('user-1');
  });

  it('get missing user -> NotFoundException', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getUser('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('update role successfully', async () => {
    const result = await service.updateUserRole(adminUser, 'user-1', { role: UserRole.HOST });
    expect(result.role).toBe(UserRole.HOST);
  });

  it('admin cannot remove own ADMIN role', async () => {
    await expect(
      service.updateUserRole(adminUser, 'admin-1', { role: UserRole.GUEST }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('sensitive fields are not included in returned user data', async () => {
    const result = await service.getUser('user-1');
    const json = JSON.stringify(result);
    expect(json).not.toContain('passwordHash');
    expect(json).not.toContain('refreshToken');
  });

  // ---- Step 3: property management ----
  it('lists properties successfully', async () => {
    const result = await service.listProperties({});
    expect(result.data).toHaveLength(mockProperties.length);
    expect(result.data[0].title).toBe('Mountain View');
  });

  it('pagination works', async () => {
    await service.listProperties({ page: 2, limit: 1 });
    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 }),
    );
  });

  it('status filter works', async () => {
    await service.listProperties({ status: 'DRAFT' as any });
    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'DRAFT' } }),
    );
  });

  it('search works', async () => {
    await service.listProperties({ search: 'aspen' });
    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: expect.objectContaining({ contains: 'aspen', mode: 'insensitive' }) }),
            expect.objectContaining({ city: expect.objectContaining({ contains: 'aspen', mode: 'insensitive' }) }),
            expect.objectContaining({ country: expect.objectContaining({ contains: 'aspen', mode: 'insensitive' }) }),
          ]),
        }),
      }),
    );
  });

  it('get existing property', async () => {
    const result = await service.getProperty('prop-1');
    expect(result.id).toBe('prop-1');
    expect(result.host.name).toBe('Bob');
  });

  it('get missing property -> NotFoundException', async () => {
    prisma.property.findUnique.mockResolvedValue(null);
    await expect(service.getProperty('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('update status successfully', async () => {
    const result = await service.updatePropertyStatus('prop-1', { status: 'ARCHIVED' as any });
    expect(result.status).toBe('ARCHIVED');
  });

  it('sensitive fields are not included in returned property data', async () => {
    const result = await service.getProperty('prop-1');
    const json = JSON.stringify(result);
    expect(json).not.toContain('passwordHash');
    expect(json).not.toContain('refreshToken');
    expect(json).not.toContain('JAZZCASH');
    expect(json).not.toContain('integritySalt');
  });

  // ---- Step 4: booking management ----
  it('lists bookings successfully', async () => {
    const result = await service.listBookings({});
    expect(result.data).toHaveLength(mockBookings.length);
    expect(result.data[0].id).toBe('bk-1');
    expect(result.data[0].guest.name).toBe('Alice');
  });

  it('pagination works', async () => {
    await service.listBookings({ page: 2, limit: 1 });
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 }),
    );
  });

  it('status filter works', async () => {
    await service.listBookings({ status: 'CONFIRMED' as any });
    expect(prisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'CONFIRMED' } }),
    );
  });

  it('get existing booking', async () => {
    const result = await service.getBooking('bk-1');
    expect(result.id).toBe('bk-1');
    expect(result.guest.name).toBe('Alice');
    expect(result.property.title).toBe('Mountain View');
  });

  it('get missing booking -> NotFoundException', async () => {
    prisma.booking.findUnique.mockResolvedValue(null);
    await expect(service.getBooking('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('update booking status successfully', async () => {
    const result = await service.updateBookingStatus('bk-1', { status: 'CANCELLED' as any });
    expect(result.status).toBe('CANCELLED');
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'bk-1' }, data: { status: 'CANCELLED' } }),
    );
  });

  it('rejects invalid transition COMPLETED -> PENDING', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'bk-1',
      status: 'COMPLETED',
      totalAmount: 1000,
    });
    await expect(
      service.updateBookingStatus('bk-1', { status: 'PENDING' as any }),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows PENDING -> CONFIRMED transition', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'bk-1',
      status: 'PENDING',
      totalAmount: 1000,
    });
    const result = await service.updateBookingStatus('bk-1', {
      status: 'CONFIRMED' as any,
    });
    expect(result.status).toBe('CANCELLED');
  });

  it('allows HOST_ACCEPTED -> CONFIRMED transition', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'bk-1',
      status: 'HOST_ACCEPTED',
      totalAmount: 1000,
    });
    const result = await service.updateBookingStatus('bk-1', {
      status: 'CONFIRMED' as any,
    });
    expect(result.status).toBe('CANCELLED');
  });

  it('throws NotFoundException for nonexistent booking on status update', async () => {
    prisma.booking.findUnique.mockResolvedValue(null);
    await expect(
      service.updateBookingStatus('nonexistent', { status: 'CONFIRMED' as any }),
    ).rejects.toThrow(NotFoundException);
  });

  it('sensitive fields are not included in returned booking data', async () => {
    const result = await service.getBooking('bk-1');
    const json = JSON.stringify(result);
    expect(json).not.toContain('passwordHash');
    expect(json).not.toContain('refreshToken');
    expect(json).not.toContain('JAZZCASH');
    expect(json).not.toContain('integritySalt');
    expect(json).not.toContain('merchantPassword');
  });

  // ---- Step 5: payment management ----
  it('lists payments successfully', async () => {
    const result = await service.listPayments({});
    expect(result.data).toHaveLength(mockPayments.length);
    expect(result.data[0].id).toBe('pay-1');
    expect(result.data[0].booking.id).toBe('bk-1');
  });

  it('pagination works', async () => {
    await service.listPayments({ page: 2, limit: 1 });
    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 1, take: 1 }),
    );
  });

  it('status filter works', async () => {
    await service.listPayments({ status: 'SUCCEEDED' as any });
    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'SUCCEEDED' } }),
    );
  });

  it('get existing payment', async () => {
    const result = await service.getPayment('pay-1');
    expect(result.id).toBe('pay-1');
    expect(result.booking.id).toBe('bk-1');
    expect(result.amount).toBe(1000);
  });

  it('get missing payment -> NotFoundException', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    await expect(service.getPayment('nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('safe update PENDING -> FAILED', async () => {
    const result = await service.updatePaymentStatus('pay-1', { status: PaymentStatus.FAILED });
    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.FAILED },
      }),
    );
  });

  it('rejects PENDING -> SUCCEEDED', async () => {
    await expect(
      service.updatePaymentStatus('pay-1', { status: PaymentStatus.SUCCEEDED }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('rejects REFUNDED status', async () => {
    await expect(
      service.updatePaymentStatus('pay-1', { status: PaymentStatus.REFUNDED }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('rejects downgrading SUCCEEDED', async () => {
    prisma.payment.findUnique.mockResolvedValue(mockPayments[1]);
    await expect(
      service.updatePaymentStatus('pay-2', { status: PaymentStatus.FAILED }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('does not modify amount, provider, or providerReference', async () => {
    await service.updatePaymentStatus('pay-1', { status: PaymentStatus.FAILED });
    const call = prisma.payment.update.mock.calls[0][0];
    expect(call.data).toEqual({ status: PaymentStatus.FAILED });
    expect(call.data.amount).toBeUndefined();
    expect(call.data.provider).toBeUndefined();
    expect(call.data.providerReference).toBeUndefined();
  });

  it('does not modify the booking', async () => {
    await service.updatePaymentStatus('pay-1', { status: PaymentStatus.FAILED });
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it('sensitive fields are not included in returned payment data', async () => {
    const result = await service.getPayment('pay-1');
    const json = JSON.stringify(result);
    expect(json).not.toContain('merchantPassword');
    expect(json).not.toContain('integritySalt');
    expect(json).not.toContain('passwordHash');
    expect(json).not.toContain('refreshToken');
    expect(json).not.toContain('accessToken');
  });
});