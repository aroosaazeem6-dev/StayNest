import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class JazzCashPaymentRequestDto {
  @ApiProperty({ description: 'JazzCash API version' })
  pp_Version!: string;

  @ApiProperty({ description: 'Transaction type' })
  pp_TxnType!: string;

  @ApiProperty({ description: 'Merchant ID' })
  pp_MerchantID!: string;

  @ApiProperty({ description: 'Transaction reference number' })
  pp_TxnRefNo!: string;

  @ApiProperty({ description: 'Amount in paisa' })
  pp_Amount!: string;

  @ApiProperty({ description: 'Transaction currency' })
  pp_TxnCurrency!: string;

  @ApiProperty({ description: 'Transaction date time' })
  pp_TxnDateTime!: string;

  @ApiProperty({ description: 'Transaction expiry date time' })
  pp_TxnExpiryDateTime!: string;

  @ApiProperty({ description: 'Bill reference' })
  pp_BillReference!: string;

  @ApiProperty({ description: 'Payment description' })
  pp_Description!: string;

  @ApiProperty({ description: 'Return URL' })
  pp_ReturnURL!: string;

  @ApiProperty({ description: 'Secure hash' })
  pp_SecureHash!: string;
}

export class PaymentInitiateResponseDto {
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

  @ApiProperty({ type: JazzCashPaymentRequestDto, description: 'JazzCash payment request fields for form submission' })
  jazzcashRequest!: JazzCashPaymentRequestDto;

  @ApiProperty({ description: 'JazzCash payment endpoint URL' })
  jazzcashEndpoint!: string;
}