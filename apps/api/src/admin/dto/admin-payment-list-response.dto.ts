import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../property/dto/property-list-response.dto';
import { AdminPaymentResponseDto } from './admin-payment-response.dto';

export class AdminPaymentListResponseDto {
  @ApiProperty({ type: [AdminPaymentResponseDto], description: 'List of payments' })
  data!: AdminPaymentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}