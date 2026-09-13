import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class ListAdminPropertiesQueryDto {
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
    description: 'Filter by property status',
    enum: PropertyStatus,
    example: PropertyStatus.ACTIVE,
  })
  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @ApiPropertyOptional({
    description: 'Search by title, city, or country (case-insensitive)',
    example: 'aspen',
  })
  @IsString()
  @IsOptional()
  search?: string;
}