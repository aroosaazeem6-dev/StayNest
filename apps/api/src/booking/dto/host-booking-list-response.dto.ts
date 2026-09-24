import { ApiProperty } from '@nestjs/swagger';
import { HostBookingResponseDto } from './host-booking-response.dto';
import { PaginationMetaDto } from './booking-list-response.dto';

export class HostBookingListResponseDto {
  @ApiProperty({ type: [HostBookingResponseDto], description: 'Host booking requests' })
  data!: HostBookingResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}
