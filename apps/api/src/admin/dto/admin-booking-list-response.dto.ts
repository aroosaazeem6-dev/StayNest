import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../property/dto/property-list-response.dto';
import { AdminBookingResponseDto } from './admin-booking-response.dto';

export class AdminBookingListResponseDto {
  @ApiProperty({ type: [AdminBookingResponseDto], description: 'List of bookings' })
  data!: AdminBookingResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}