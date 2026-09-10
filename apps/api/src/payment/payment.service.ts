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
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    guest: AuthenticatedUser,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
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

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: booking.totalAmount,
        currency: 'PKR',
        status: PaymentStatus.PENDING,
        provider: 'JAZZCASH',
      },
    });

    return this.toResponseDto(payment);
  }

  private toResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      providerReference: payment.providerReference,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}