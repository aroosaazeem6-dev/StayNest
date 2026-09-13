import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, PropertyType } from '@prisma/client';

/**
 * Safe guest subset returned inside an admin booking response.
 * Deliberately excludes email, passwordHash, refreshTokens, etc.
 */
export class AdminBookingGuestDto {
  @ApiProperty({ description: 'Guest user ID' })
  id!: string;

  @ApiProperty({ description: 'Guest name' })
  name!: string;
}

/**
 * Safe property subset returned inside an admin booking response.
 * Deliberately excludes host secrets.
 */
export class AdminBookingPropertyDto {
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

  @ApiProperty({ description: 'Price per night' })
  pricePerNight!: number;

  @ApiProperty({ description: 'Host user ID' })
  hostId!: string;
}

/**
 * Safe admin booking response.
 *
 * Deliberately excludes:
 * - guest email, passwordHash, refreshTokens
 * - payment credentials, JazzCash merchant password, integrity salt
 * - authentication secrets
 */
export class AdminBookingResponseDto {
  @ApiProperty({ description: 'Booking ID' })
  id!: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId!: string;

  @ApiProperty({ description: 'Guest user ID' })
  guestId!: string;

  @ApiProperty({ description: 'Check-in date (ISO)' })
  checkIn!: string;

  @ApiProperty({ description: 'Check-out date (ISO)' })
  checkOut!: string;

  @ApiProperty({ description: 'Number of guests' })
  guests!: number;

  @ApiProperty({ description: 'Booking status', enum: BookingStatus })
  status!: BookingStatus;

  @ApiProperty({ description: 'Total amount' })
  totalAmount!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;

  @ApiProperty({ type: AdminBookingPropertyDto, description: 'Safe property details' })
  property!: AdminBookingPropertyDto;

  @ApiProperty({ type: AdminBookingGuestDto, description: 'Safe guest details' })
  guest!: AdminBookingGuestDto;
}