import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  BookingStatus,
  Payment,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentInitiateResponseDto } from './dto/payment-initiate-response.dto';
import { JazzCashGateway } from './gateways/jazzcash/jazzcash.gateway';
import { JazzCashCallbackResponse } from './gateways/jazzcash/jazzcash.types';

export interface JazzCashRedirectData {
  html: string;
  endpointUrl: string;
  transactionRef: string;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jazzcashGateway: JazzCashGateway,
  ) {}

  async create(
    guest: AuthenticatedUser,
    dto: CreatePaymentDto,
  ): Promise<PaymentInitiateResponseDto> {
    if (guest.role !== UserRole.GUEST) {
      throw new ForbiddenException('Only GUEST users can create payments');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== guest.id) {
      throw new ForbiddenException('Booking does not belong to the authenticated guest');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking must be PENDING to create a payment');
    }

    if (booking.payment) {
      throw new BadRequestException('Payment already exists for this booking');
    }

    if (!this.jazzcashGateway.isConfigured()) {
      throw new BadRequestException('JazzCash gateway is not configured');
    }

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: booking.totalAmount,
        currency: 'PKR',
        status: PaymentStatus.PENDING,
        provider: 'JAZZCASH',
      },
    });

    const jazzcashPrepared = this.jazzcashGateway.preparePayment({
      bookingId: dto.bookingId,
      amount: Number(booking.totalAmount),
      description: `StayNest booking ${dto.bookingId}`,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerReference: jazzcashPrepared.transactionRef },
    });

    return this.toInitiateResponseDto(payment, jazzcashPrepared);
  }

  async prepareJazzCashRedirect(
    guest: AuthenticatedUser,
    paymentId: string,
  ): Promise<JazzCashRedirectData> {
    if (guest.role !== UserRole.GUEST) {
      throw new ForbiddenException('Only GUEST users can initiate JazzCash payments');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.booking.guestId !== guest.id) {
      throw new ForbiddenException('Payment does not belong to the authenticated guest');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment must be PENDING to initiate JazzCash redirect');
    }

    if (!this.jazzcashGateway.isConfigured()) {
      throw new BadRequestException('JazzCash gateway is not configured');
    }

    const jazzcashPrepared = this.jazzcashGateway.preparePayment({
      bookingId: payment.bookingId,
      amount: Number(payment.amount),
      description: `StayNest booking ${payment.bookingId}`,
    });

    if (payment.providerReference !== jazzcashPrepared.transactionRef) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { providerReference: jazzcashPrepared.transactionRef },
      });
    }

    const html = this.buildAutoSubmitForm(jazzcashPrepared);

    return {
      html,
      endpointUrl: jazzcashPrepared.endpointUrl,
      transactionRef: jazzcashPrepared.transactionRef,
    };
  }

  private buildAutoSubmitForm(jazzcashPrepared: ReturnType<JazzCashGateway['preparePayment']>): string {
    const { requestFields, endpointUrl } = jazzcashPrepared;

    const fieldsHtml = Object.entries(requestFields)
      .map(([key, value]) => {
        const escapedValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        return `<input type="hidden" name="${key}" value="${escapedValue}">`;
      })
      .join('\n        ');

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting to JazzCash...</title>
  </head>
  <body onload="document.getElementById('jazzcash-form').submit()">
    <p>Redirecting to JazzCash for payment...</p>
    <form id="jazzcash-form" method="POST" action="${endpointUrl}">
      ${fieldsHtml}
    </form>
    <script>
      // Fallback in case onload doesn't fire
      document.getElementById('jazzcash-form').submit();
    </script>
  </body>
</html>`;
  }

  private toInitiateResponseDto(
    payment: Payment,
    jazzcashPrepared: ReturnType<JazzCashGateway['preparePayment']>,
  ): PaymentInitiateResponseDto {
    const { requestFields, endpointUrl, transactionRef } = jazzcashPrepared;

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      providerReference: transactionRef,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      jazzcashRequest: {
        pp_Version: requestFields.pp_Version,
        pp_TxnType: requestFields.pp_TxnType,
        pp_MerchantID: requestFields.pp_MerchantID,
        pp_TxnRefNo: requestFields.pp_TxnRefNo,
        pp_Amount: requestFields.pp_Amount,
        pp_TxnCurrency: requestFields.pp_TxnCurrency,
        pp_TxnDateTime: requestFields.pp_TxnDateTime,
        pp_TxnExpiryDateTime: requestFields.pp_TxnExpiryDateTime,
        pp_BillReference: requestFields.pp_BillReference,
        pp_Description: requestFields.pp_Description,
        pp_ReturnURL: requestFields.pp_ReturnURL,
        pp_SecureHash: requestFields.pp_SecureHash,
      },
      jazzcashEndpoint: endpointUrl,
    };
  }

  /**
   * Handles a JazzCash callback (return URL POST).
   *
   * The callback is PUBLIC — no JWT — because JazzCash calls it directly.
   *
   * Processing order:
   *   A. Verify the secure hash first. Never trust pp_ResponseCode.
   *   B. Find the Payment by providerReference = pp_TxnRefNo.
   *   C. Validate merchant ID.
   *   D. Validate currency is PKR.
   *   E. Validate pp_Amount matches Payment.amount (in paisa).
   *   F. Only then process the response code.
   *
   * State transitions:
   *   PENDING + success (000)  => Payment SUCCEEDED, Booking CONFIRMED
   *   PENDING + failure        => Payment FAILED,   Booking PENDING
   *
   * Idempotency:
   *   - SUCCEEDED + duplicate success => no change, safe success
   *   - SUCCEEDED + later failure    => never downgrade
   *   - FAILED + success              => never upgrade
   *   - FAILED + failure             => idempotent
   *   - CANCELLED / COMPLETED bookings are never confirmed
   */
  async handleJazzCashCallback(
    response: JazzCashCallbackResponse,
  ): Promise<{ success: boolean }> {
    // A. Verify the secure hash FIRST. Reject before any state mutation.
    if (!this.jazzcashGateway.verifyResponseHash(response)) {
      throw new BadRequestException('Invalid JazzCash callback secure hash');
    }

    // B. Find the Payment by providerReference = pp_TxnRefNo.
    // providerReference is not a @unique field, so use findMany with take: 1.
    const payments = await this.prisma.payment.findMany({
      where: { providerReference: response.pp_TxnRefNo },
      include: { booking: true },
      take: 1,
    });

    const payment = payments[0] ?? null;

    if (!payment || !payment.booking) {
      // Unknown transaction — do not create anything, do not modify anything.
      throw new NotFoundException('Payment not found for JazzCash callback');
    }

    // C. Validate merchant ID.
    if (response.pp_MerchantID !== this.jazzcashGateway.merchantId) {
      throw new BadRequestException('Invalid JazzCash merchant ID');
    }

    // D. Validate currency is PKR.
    if (response.pp_TxnCurrency !== 'PKR') {
      throw new BadRequestException('Invalid JazzCash callback currency');
    }

    // E. Validate pp_Amount matches Payment.amount (in paisa).
    const expectedAmount = this.jazzcashGateway.convertAmountToJazzCashFormat(
      Number(payment.amount),
    );
    if (response.pp_Amount !== expectedAmount) {
      throw new BadRequestException('JazzCash callback amount mismatch');
    }

    // F. Process the response code.
    const isSuccessful = response.pp_ResponseCode === '000';

    await this.applyCallbackState(payment, isSuccessful);

    return { success: true };
  }

  /**
   * Applies the callback state transition atomically within a Prisma
   * transaction, respecting idempotency and booking-state protection.
   */
  private async applyCallbackState(
    payment: Payment & { booking: { id: string; status: BookingStatus } },
    isSuccessful: boolean,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { booking: true },
      });

      if (!currentPayment || !currentPayment.booking) {
        return;
      }

      const paymentStatus = currentPayment.status;
      const bookingStatus = currentPayment.booking.status;

      // Idempotency / downgrade protection.
      if (paymentStatus === PaymentStatus.SUCCEEDED) {
        // Already successful — never downgrade, even on a late failure.
        return;
      }

      if (paymentStatus === PaymentStatus.FAILED) {
        // A failed payment must never be upgraded to SUCCEEDED by a late callback.
        if (isSuccessful) {
          return;
        }
        // Re-applying failure is idempotent.
        return;
      }

      if (paymentStatus !== PaymentStatus.PENDING) {
        // Unknown payment state — do nothing.
        return;
      }

      // Booking state protection: only PENDING bookings can be confirmed.
      if (isSuccessful && bookingStatus !== BookingStatus.PENDING) {
        // Do not confirm CANCELLED / COMPLETED / etc. bookings.
        // Mark payment as failed instead so the attempt is recorded.
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: { status: PaymentStatus.FAILED },
        });
        return;
      }

      if (isSuccessful) {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: { status: PaymentStatus.SUCCEEDED },
        });
        await tx.booking.update({
          where: { id: currentPayment.booking.id },
          data: { status: BookingStatus.CONFIRMED },
        });
      } else {
        await tx.payment.update({
          where: { id: currentPayment.id },
          data: { status: PaymentStatus.FAILED },
        });
        // Booking remains PENDING.
      }
    });
  }
}