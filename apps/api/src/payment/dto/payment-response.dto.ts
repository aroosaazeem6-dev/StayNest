import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id!: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId!: string;

  @ApiProperty({ description: 'Payment amount' })
  amount!: number;

  @ApiProperty({ description: 'Currency code', example: 'PKR' })
  currency!: string;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status!: PaymentStatus;

  @ApiProperty({ description: 'Payment provider', example: 'JAZZCASH', nullable: true })
  provider!: string | null;

  @ApiProperty({ description: 'Provider transaction reference', nullable: true })
  providerReference!: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;
}