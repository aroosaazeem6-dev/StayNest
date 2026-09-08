import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Minimum price per night (>= 0)',
    example: 100,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price per night (>= 0)',
    example: 500,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum guest capacity (>= 1)',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  minGuests?: number;

  @ApiPropertyOptional({
    description: 'Minimum number of bedrooms (>= 0). Null bedrooms do not satisfy the filter.',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  minBedrooms?: number;

  @ApiPropertyOptional({
    description: 'Amenity IDs (AND semantics — property must have ALL specified amenities)',
    example: ['amenity-wifi-id', 'amenity-kitchen-id'],
    type: [String],
  })
  @IsOptional()
  amenityIds?: string | string[];

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['newest', 'oldest', 'price_asc', 'price_desc'],
    default: 'newest',
  })
  @IsEnum(['newest', 'oldest', 'price_asc', 'price_desc'])
  @IsOptional()
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}
