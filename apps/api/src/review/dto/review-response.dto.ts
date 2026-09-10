import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';

/**
 * Safe property subset returned inside a review.
 * Deliberately excludes hostId and other sensitive fields.
 */
export class ReviewPropertyDto {
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

/**
 * Safe guest subset returned inside a review.
 * Deliberately excludes email, passwordHash, refreshTokens, etc.
 */
export class ReviewGuestDto {
  @ApiProperty({ description: 'Guest user ID' })
  id!: string;

  @ApiProperty({ description: 'Guest name' })
  name!: string;
}

export class ReviewResponseDto {
  @ApiProperty({ description: 'Review ID' })
  id!: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId!: string;

  @ApiProperty({ description: 'Guest user ID' })
  guestId!: string;

  @ApiProperty({ description: 'Booking ID being reviewed' })
  bookingId!: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  rating!: number;

  @ApiProperty({ description: 'Review comment', nullable: true })
  comment!: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;

  @ApiProperty({ type: ReviewPropertyDto, description: 'Safe property details' })
  property!: ReviewPropertyDto;

  @ApiProperty({ type: ReviewGuestDto, description: 'Safe guest details' })
  guest!: ReviewGuestDto;
}