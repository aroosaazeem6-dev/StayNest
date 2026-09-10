import { ApiProperty } from '@nestjs/swagger';
import { FavoriteResponseDto } from './favorite-response.dto';
import { PaginationMetaDto } from '../../property/dto/property-list-response.dto';

export class FavoriteListResponseDto {
  @ApiProperty({ type: [FavoriteResponseDto], description: 'List of favorites' })
  data!: FavoriteResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}