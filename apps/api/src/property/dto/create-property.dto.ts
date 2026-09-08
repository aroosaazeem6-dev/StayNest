import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Property title',
    example: 'Cozy Mountain Cabin',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Property description',
    example: 'A charming cabin in the mountains with panoramic views.',
    required: false,
    maxLength: 5000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'Type of property',
    enum: PropertyType,
    example: PropertyType.COTTAGE,
  })
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @ApiProperty({
    description: 'Full address',
    required: false,
    example: '123 Mountain View Rd',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'City', required: false, example: 'Aspen' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'State / region', required: false, example: 'CO' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: 'Country', required: false, example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Latitude',
    required: false,
    minimum: -90,
    maximum: 90,
    example: 39.1911,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude',
    required: false,
    minimum: -180,
    maximum: 180,
    example: -106.8175,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Price per night in USD',
    example: 250.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerNight!: number;

  @ApiProperty({
    description: 'Maximum number of guests',
    example: 4,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  maxGuests!: number;

  @ApiProperty({ description: 'Number of bedrooms', required: false, minimum: 0, example: 2 })
  @IsInt()
  @Min(0)
  @IsOptional()
  bedrooms?: number;

  @ApiProperty({
    description: 'Number of bathrooms',
    required: false,
    minimum: 0,
    example: 1.5,
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @IsOptional()
  bathrooms?: number;

  @ApiProperty({
    description: 'Array of amenity IDs to associate',
    required: false,
    example: ['amenity-wifi-id', 'amenity-kitchen-id'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenityIds?: string[];

  @ApiProperty({
    description: 'Array of image URLs for the property',
    required: false,
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}
