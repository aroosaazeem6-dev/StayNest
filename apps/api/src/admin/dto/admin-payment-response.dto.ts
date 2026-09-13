import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

/**
 * Safe booking subset returned inside an admin payment response.
 * Deliberately excludes guest email, passwordHash, refreshTokens, etc.
 */
export class AdminPaymentBookingDto {
  @ApiProperty({ description: 'Booking ID' })
  id!: string;

  @ApiProperty({ description: 'Guest user ID' })
  guestId!: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId!: string;

  @ApiProperty({ description: 'Booking status', example: 'PENDING' })
  status!: string;
}

/**
 * Safe admin payment response.
 *
 * Deliberately excludes:
 * - JazzCash merchant password
 * - JazzCash integrity salt
 * - access tokens / refresh tokens
 * - password hashes
 * - secret environment variables
 */
export class AdminPaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id!: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId!: string;

  @ApiProperty({ description: 'Payment provider', example: 'JAZZCASH', nullable: true })
  provider!: string | null;

  @ApiProperty({ description: 'Provider transaction reference', nullable: true })
  providerReference!: string | null;

  @ApiProperty({ description: 'Payment amount' })
  amount!: number;

  @ApiProperty({ description: 'Currency code', example: 'PKR' })
  currency!: string;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status!: PaymentStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;

  @ApiProperty({ type: AdminPaymentBookingDto, description: 'Safe booking details' })
  booking!: AdminPaymentBookingDto;
}