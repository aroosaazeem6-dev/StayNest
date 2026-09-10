import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { JazzCashGateway } from './gateways/jazzcash/jazzcash.gateway';
import { JazzCashCallbackResponse } from './gateways/jazzcash/jazzcash.types';
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
  $transaction: jest.Mock;
  booking: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  payment: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

type MockJazzCashGateway = {
  isConfigured: jest.Mock;
  preparePayment: jest.Mock;
  verifyResponseHash: jest.Mock;
  merchantId: string;
  convertAmountToJazzCashFormat: jest.Mock;
};

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: MockPrismaService;
  let jazzcashGateway: MockJazzCashGateway;

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
    providerReference: 'TNXBK1ABC123',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockPendingPayment = {
    ...mockPayment,
    status: PaymentStatus.PENDING,
    booking: {
      ...mockBooking,
      status: BookingStatus.PENDING,
    },
  };

  const buildCallback = (
    overrides: Partial<JazzCashCallbackResponse> = {},
  ): JazzCashCallbackResponse => ({
    pp_ResponseCode: '000',
    pp_ResponseMessage: 'Thank you for Using JazzCash, your transaction was successful.',
    pp_TxnRefNo: 'TNXBK1ABC123',
    pp_SecureHash: 'VALIDHASH',
    pp_Amount: '40000',
    pp_TxnCurrency: 'PKR',
    pp_MerchantID: 'MC12345',
    pp_TxnDateTime: '20260910120000',
    pp_TxnExpiryDateTime: '20260910123000',
    pp_BillReference: 'bk-1',
    pp_Description: 'StayNest booking bk-1',
    extraFields: {},
    ...overrides,
  });

  const mockJazzCashPrepared = {
    transactionRef: 'TNXBK1ABC123',
    amount: '40000',
    currency: 'PKR',
    requestFields: {
      pp_Version: '1.0',
      pp_TxnType: 'MWALLET',
      pp_MerchantID: 'MC12345',
      pp_Password: 'testpassword',
      pp_TxnRefNo: 'TNXBK1ABC123',
      pp_Amount: '40000',
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: '20260910120000',
      pp_TxnExpiryDateTime: '20260910123000',
      pp_BillReference: 'bk-1',
      pp_Description: 'StayNest booking bk-1',
      pp_ReturnURL: 'https://example.com/payment/callback',
      pp_SecureHash: 'ABC123HASH',
    },
    endpointUrl: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionpayments.aspx',
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
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(mockPrisma)),
      booking: {
        findUnique: jest.fn().mockResolvedValue(mockPendingPayment.booking),
        update: jest.fn(),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([mockPendingPayment]),
        findUnique: jest.fn().mockResolvedValue(mockPendingPayment),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockJazzCashGateway: MockJazzCashGateway = {
      isConfigured: jest.fn().mockReturnValue(true),
      preparePayment: jest.fn().mockReturnValue(mockJazzCashPrepared),
      verifyResponseHash: jest.fn().mockReturnValue(true),
      merchantId: 'MC12345',
      convertAmountToJazzCashFormat: jest.fn().mockImplementation((amount: number) => String(Math.round(amount * 100))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JazzCashGateway, useValue: mockJazzCashGateway },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
    jazzcashGateway = module.get(JazzCashGateway) as unknown as MockJazzCashGateway;
  });

  describe('create', () => {
    it('creates a payment with correct amount, currency, status, and provider', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.id).toBe('pay-1');
      expect(result.bookingId).toBe('bk-1');
      expect(result.amount).toBe(400);
      expect(result.currency).toBe('PKR');
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.provider).toBe('JAZZCASH');
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

    it('calls JazzCashGateway.preparePayment with correct payment information', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      await service.create(guestUser, { bookingId: 'bk-1' });

      expect(jazzcashGateway.preparePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'bk-1',
          amount: 400,
          description: 'StayNest booking bk-1',
        }),
      );
    });

    it('providerReference is saved from JazzCash transactionRef', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.providerReference).toBe(mockJazzCashPrepared.transactionRef);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { providerReference: mockJazzCashPrepared.transactionRef },
      });
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
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        amount: new Prisma.Decimal(750.5),
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.amount).toBe(750.5);
      expect(jazzcashGateway.preparePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 750.5,
        }),
      );
    });

    it('currency is PKR', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.currency).toBe('PKR');
    });

    it('status is PENDING', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('provider is JAZZCASH', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.provider).toBe('JAZZCASH');
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

    it('throws BadRequestException when JazzCash gateway is not configured', async () => {
      jazzcashGateway.isConfigured.mockReturnValue(false);
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(service.create(guestUser, { bookingId: 'bk-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when JazzCash gateway preparePayment fails', async () => {
      jazzcashGateway.preparePayment.mockImplementation(() => {
        throw new Error('JazzCash gateway error');
      });
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);

      await expect(service.create(guestUser, { bookingId: 'bk-1' })).rejects.toThrow(
        Error,
      );
    });

    it('response does not contain pp_Password', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      const resultString = JSON.stringify(result);
      expect(resultString).not.toContain('pp_Password');
      expect(resultString).not.toContain('testpassword');
      expect(result.jazzcashRequest).not.toHaveProperty('pp_Password');
    });

    it('response does not contain JAZZCASH_INTEGRITY_SALT', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      const resultString = JSON.stringify(result);
      expect(resultString).not.toContain('integritysalt');
      expect(resultString).not.toContain('INTEGRITY');
      expect(resultString).not.toContain('salt');
    });

    it('includes JazzCash request fields without pp_Password', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.jazzcashRequest).toBeDefined();
      expect(result.jazzcashRequest.pp_Version).toBe('1.0');
      expect(result.jazzcashRequest.pp_TxnType).toBe('MWALLET');
      expect(result.jazzcashRequest.pp_MerchantID).toBe('MC12345');
      expect(result.jazzcashRequest.pp_TxnRefNo).toBe('TNXBK1ABC123');
      expect(result.jazzcashRequest.pp_Amount).toBe('40000');
      expect(result.jazzcashRequest.pp_TxnCurrency).toBe('PKR');
      expect(result.jazzcashRequest.pp_BillReference).toBe('bk-1');
      expect(result.jazzcashRequest.pp_ReturnURL).toBe('https://example.com/payment/callback');
      expect(result.jazzcashRequest.pp_SecureHash).toBe('ABC123HASH');
      expect(result.jazzcashRequest).not.toHaveProperty('pp_Password');
    });

    it('includes JazzCash endpoint URL', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.payment.create.mockResolvedValue(mockPayment);
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        providerReference: mockJazzCashPrepared.transactionRef,
      });

      const result = await service.create(guestUser, { bookingId: 'bk-1' });

      expect(result.jazzcashEndpoint).toBe(
        'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionpayments.aspx',
      );
    });
  });

  describe('prepareJazzCashRedirect', () => {
    it('escapes HTML attribute special characters in field values', async () => {
      const maliciousFields = {
        ...mockJazzCashPrepared.requestFields,
        pp_Description: 'StayNest <b>booking</b> & "test" \'quote\'',
        pp_BillReference: 'bk-1<script>alert(1)</script>',
      };

      jazzcashGateway.preparePayment.mockReturnValue({
        ...mockJazzCashPrepared,
        requestFields: maliciousFields,
      });

      const paymentWithBooking = {
        ...mockPayment,
        booking: mockBooking,
      };

      prisma.payment.findUnique.mockResolvedValue(paymentWithBooking);
      prisma.payment.update.mockResolvedValue(paymentWithBooking);

      const result = await service.prepareJazzCashRedirect(guestUser, 'pay-1');

      expect(result.html).toContain('pp_Description');
      expect(result.html).toContain('&amp;');
      expect(result.html).toContain('&lt;');
      expect(result.html).toContain('&gt;');
      expect(result.html).toContain('&quot;');
      expect(result.html).toContain('&#39;');
      expect(result.html).toContain('value="bk-1&lt;script&gt;alert(1)&lt;/script&gt;"');
      expect(result.html).toContain('value="StayNest &lt;b&gt;booking&lt;/b&gt; &amp; &quot;test&quot; &#39;quote&#39;"');
    });
  });

  describe('handleJazzCashCallback', () => {
    beforeEach(() => {
      prisma.payment.findUnique.mockResolvedValue(mockPendingPayment);
      prisma.payment.update.mockResolvedValue({ ...mockPendingPayment });
      prisma.booking.update.mockResolvedValue(mockPendingPayment.booking);
    });

    it('verifies the secure hash before any state change', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(false);

      await expect(service.handleJazzCashCallback(buildCallback())).rejects.toThrow(
        BadRequestException,
      );

      expect(jazzcashGateway.verifyResponseHash).toHaveBeenCalled();
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects an invalid secure hash without modifying anything', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(false);

      await expect(service.handleJazzCashCallback(buildCallback())).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects an unknown transaction reference', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);
      prisma.payment.findMany.mockResolvedValue([]);

      await expect(
        service.handleJazzCashCallback(
          buildCallback({ pp_TxnRefNo: 'UNKNOWN-REF' }),
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects a wrong merchant ID', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      await expect(
        service.handleJazzCashCallback(
          buildCallback({ pp_MerchantID: 'WRONG-MERCHANT' }),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects a wrong currency', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      await expect(
        service.handleJazzCashCallback(
          buildCallback({ pp_TxnCurrency: 'USD' }),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects an amount mismatch', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      await expect(
        service.handleJazzCashCallback(buildCallback({ pp_Amount: '99999' })),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('successful callback changes Payment to SUCCEEDED and Booking to CONFIRMED', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      const result = await service.handleJazzCashCallback(buildCallback());

      expect(result).toEqual({ success: true });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.SUCCEEDED },
      });
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'bk-1' },
        data: { status: BookingStatus.CONFIRMED },
      });
    });

    it('failed callback changes Payment to FAILED and leaves Booking PENDING', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      const result = await service.handleJazzCashCallback(
        buildCallback({ pp_ResponseCode: '101', pp_ResponseMessage: 'Transaction failed' }),
      );

      expect(result).toEqual({ success: true });
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.FAILED },
      });
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('duplicate successful callback is idempotent', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      const succeededPayment = {
        ...mockPendingPayment,
        status: PaymentStatus.SUCCEEDED,
        booking: {
          ...mockPendingPayment.booking,
          status: BookingStatus.CONFIRMED,
        },
      };

      prisma.payment.findUnique.mockResolvedValue(succeededPayment);

      const result = await service.handleJazzCashCallback(buildCallback());

      expect(result).toEqual({ success: true });
      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('already successful payment is not downgraded by a later failure', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      const succeededPayment = {
        ...mockPendingPayment,
        status: PaymentStatus.SUCCEEDED,
        booking: {
          ...mockPendingPayment.booking,
          status: BookingStatus.CONFIRMED,
        },
      };

      prisma.payment.findUnique.mockResolvedValue(succeededPayment);

      await service.handleJazzCashCallback(
        buildCallback({ pp_ResponseCode: '101', pp_ResponseMessage: 'Late failure' }),
      );

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('already failed payment is not upgraded by a later success', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      const failedPayment = {
        ...mockPendingPayment,
        status: PaymentStatus.FAILED,
      };

      prisma.payment.findUnique.mockResolvedValue(failedPayment);

      await service.handleJazzCashCallback(buildCallback());

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('cancelled booking is not confirmed', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      const cancelledPayment = {
        ...mockPendingPayment,
        booking: {
          ...mockPendingPayment.booking,
          status: BookingStatus.CANCELLED,
        },
      };

      prisma.payment.findUnique.mockResolvedValue(cancelledPayment);

      await service.handleJazzCashCallback(buildCallback());

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.FAILED },
      });
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('completed booking is not confirmed', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      const completedPayment = {
        ...mockPendingPayment,
        booking: {
          ...mockPendingPayment.booking,
          status: BookingStatus.COMPLETED,
        },
      };

      prisma.payment.findUnique.mockResolvedValue(completedPayment);

      await service.handleJazzCashCallback(buildCallback());

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.FAILED },
      });
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('Payment and Booking updates are atomic within a Prisma transaction', async () => {
      jazzcashGateway.verifyResponseHash.mockReturnValue(true);

      // Simulate a transaction failure mid-way: payment update succeeds but
      // booking update throws. The whole transaction must roll back.
      prisma.payment.update.mockResolvedValue({ ...mockPendingPayment });
      prisma.booking.update.mockRejectedValue(new Error('Booking update failed'));

      await expect(service.handleJazzCashCallback(buildCallback())).rejects.toThrow(
        'Booking update failed',
      );
    });
  });
});