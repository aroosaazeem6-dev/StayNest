import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PropertyType } from '@prisma/client';

export class FindPropertiesQueryDto {
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
    description: 'Filter by city name (case-insensitive)',
    example: 'Aspen',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by country (case-insensitive)',
    example: 'USA',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    enum: PropertyType,
    description: 'Filter by property type',
  })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;
}
