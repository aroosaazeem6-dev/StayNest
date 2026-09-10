import { ApiProperty } from '@nestjs/swagger';

/**
 * JazzCash callback (return URL) payload.
 *
 * JazzCash posts transaction results to the configured pp_ReturnURL.
 * The endpoint is PUBLIC — no JWT — because JazzCash calls it directly.
 *
 * Additional pp_* fields returned by JazzCash are accepted via the
 * `extraFields` record so the hash can be recomputed over the full set.
 */
export class JazzCashCallbackDto {
  @ApiProperty({
    description: 'JazzCash response code ("000" = success)',
    example: '000',
  })
  pp_ResponseCode!: string;

  @ApiProperty({
    description: 'JazzCash response message',
    example: 'Thank you for Using JazzCash, your transaction was successful.',
  })
  pp_ResponseMessage!: string;

  @ApiProperty({ description: 'Transaction reference returned by JazzCash', example: 'TNXBOOK1234567890AB' })
  pp_TxnRefNo!: string;

  @ApiProperty({ description: 'Secure hash returned by JazzCash (verified, never trusted)', example: 'ABC123...' })
  pp_SecureHash!: string;

  @ApiProperty({ description: 'Transaction amount in JazzCash paisa format', example: '40000' })
  pp_Amount!: string;

  @ApiProperty({ description: 'Transaction currency', example: 'PKR' })
  pp_TxnCurrency!: string;

  @ApiProperty({ description: 'Merchant ID', example: 'MC12345' })
  pp_MerchantID!: string;

  @ApiProperty({ description: 'Transaction date/time (YYYYMMDDHHmmss)', example: '20260910120000' })
  pp_TxnDateTime!: string;

  @ApiProperty({ description: 'Transaction expiry date/time (YYYYMMDDHHmmss)', example: '20260910123000' })
  pp_TxnExpiryDateTime!: string;

  @ApiProperty({ description: 'Bill reference echoed back by JazzCash', example: 'bk-1' })
  pp_BillReference!: string;

  @ApiProperty({ description: 'Transaction description echoed back by JazzCash', example: 'StayNest booking bk-1' })
  pp_Description!: string;

  /**
   * Any additional pp_* fields returned by JazzCash that are not part of
   * the explicit interface above. These are included in the secure-hash
   * recomputation so the hash verification remains complete.
   */
  extraFields: Record<string, string> = {};
}