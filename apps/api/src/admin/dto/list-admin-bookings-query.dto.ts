import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class ListAdminBookingsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
}