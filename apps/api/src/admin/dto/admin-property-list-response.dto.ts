import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../property/dto/property-list-response.dto';
import { AdminPropertyResponseDto } from './admin-property-response.dto';

export class AdminPropertyListResponseDto {
  @ApiProperty({ type: [AdminPropertyResponseDto], description: 'List of properties' })
  data!: AdminPropertyResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}