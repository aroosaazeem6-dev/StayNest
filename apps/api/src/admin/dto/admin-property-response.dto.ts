import { ApiProperty } from '@nestjs/swagger';
import { PropertyStatus, PropertyType } from '@prisma/client';

/**
 * Safe host subset returned inside an admin property response.
 * Deliberately excludes email, passwordHash, refreshTokens, etc.
 */
export class AdminPropertyHostDto {
  @ApiProperty({ description: 'Host user ID' })
  id!: string;

  @ApiProperty({ description: 'Host name' })
  name!: string;
}

/**
 * Safe admin property response.
 *
 * Deliberately excludes:
 * - host email, passwordHash, refreshTokens
 * - any payment/JazzCash credentials
 * - integrity salts
 */
export class AdminPropertyResponseDto {
  @ApiProperty({ description: 'Property ID' })
  id!: string;

  @ApiProperty({ description: 'Host (owner) user ID' })
  hostId!: string;

  @ApiProperty({ description: 'Property title' })
  title!: string;

  @ApiProperty({ description: 'Property description', nullable: true })
  description!: string | null;

  @ApiProperty({ enum: PropertyType, description: 'Property type' })
  propertyType!: PropertyType;

  @ApiProperty({ description: 'Full address', nullable: true })
  address!: string | null;

  @ApiProperty({ description: 'City', nullable: true })
  city!: string | null;

  @ApiProperty({ description: 'State / region', nullable: true })
  state!: string | null;

  @ApiProperty({ description: 'Country', nullable: true })
  country!: string | null;

  @ApiProperty({ description: 'Latitude', nullable: true })
  latitude!: number | null;

  @ApiProperty({ description: 'Longitude', nullable: true })
  longitude!: number | null;

  @ApiProperty({ description: 'Price per night', example: 250.0 })
  pricePerNight!: number;

  @ApiProperty({ description: 'Maximum number of guests' })
  maxGuests!: number;

  @ApiProperty({ description: 'Number of bedrooms', nullable: true })
  bedrooms!: number | null;

  @ApiProperty({ description: 'Number of bathrooms', nullable: true })
  bathrooms!: number | null;

  @ApiProperty({ enum: PropertyStatus, description: 'Property status' })
  status!: PropertyStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;

  @ApiProperty({ type: AdminPropertyHostDto, description: 'Safe host details' })
  host!: AdminPropertyHostDto;
}