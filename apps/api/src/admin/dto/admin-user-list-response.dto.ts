import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../property/dto/property-list-response.dto';
import { AdminUserResponseDto } from './admin-user-response.dto';

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto], description: 'List of users' })
  data!: AdminUserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}