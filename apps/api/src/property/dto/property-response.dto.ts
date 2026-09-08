import { ApiProperty } from '@nestjs/swagger';
import { PropertyStatus, PropertyType } from '@prisma/client';
import { AmenityDto } from './amenity.dto';
import { PropertyImageDto } from './property-image.dto';

export class PropertyResponseDto {
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

  @ApiProperty({ description: 'Price per night in USD', example: 250.0 })
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
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ type: [PropertyImageDto], description: 'Property images' })
  images!: PropertyImageDto[];

  @ApiProperty({ type: [AmenityDto], description: 'Property amenities' })
  amenities!: AmenityDto[];
}
