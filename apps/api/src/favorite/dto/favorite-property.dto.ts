import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';

/**
 * Safe property subset returned inside a favorite.
 * Deliberately excludes hostId, pricePerNight, maxGuests, status, images,
 * amenities, and other sensitive or heavy fields.
 */
export class FavoritePropertyDto {
  @ApiProperty({ description: 'Property ID' })
  id!: string;

  @ApiProperty({ description: 'Property title' })
  title!: string;

  @ApiProperty({ description: 'Property type', enum: PropertyType })
  propertyType!: PropertyType;

  @ApiProperty({ description: 'City', nullable: true })
  city!: string | null;

  @ApiProperty({ description: 'Country', nullable: true })
  country!: string | null;
}