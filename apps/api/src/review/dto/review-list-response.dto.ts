import { ApiProperty } from '@nestjs/swagger';
import { ReviewResponseDto } from './review-response.dto';
import { PaginationMetaDto } from '../../property/dto/property-list-response.dto';

export class ReviewListResponseDto {
  @ApiProperty({ type: [ReviewResponseDto], description: 'List of reviews' })
  data!: ReviewResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}