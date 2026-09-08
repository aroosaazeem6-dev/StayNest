import { ApiProperty } from '@nestjs/swagger';
import { PropertyResponseDto } from './property-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Total number of items', example: 25 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages!: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNext!: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrev!: boolean;
}

export class PropertyListResponseDto {
  @ApiProperty({ type: [PropertyResponseDto], description: 'List of properties' })
  data!: PropertyResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}
