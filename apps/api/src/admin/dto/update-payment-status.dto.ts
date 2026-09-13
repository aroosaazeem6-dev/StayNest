import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

/**
 * Allowed administrative payment status transitions.
 *
 * This is intentionally restrictive:
 *   - PENDING -> SUCCEEDED is NOT allowed through this generic endpoint
 *     because it would fake a successful payment without a real gateway
 *     transaction. The existing JazzCash callback is the ONLY path that
 *     marks a payment SUCCEEDED.
 *   - REFUNDED is NOT allowed because it would imply a real gateway refund
 *     that is not implemented in this step.
 *
 * The only safe administrative transition is PENDING -> FAILED.
 */
export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'New payment status (only FAILED is allowed from PENDING)',
    enum: PaymentStatus,
    example: PaymentStatus.FAILED,
  })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}