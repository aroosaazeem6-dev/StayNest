import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, PropertyType } from '@prisma/client';

export class BookingPropertyDto {
  @ApiProperty({ description: 'Property ID' })
  id!: string;

  @ApiProperty({ description: 'Property title' })
  title!: string;

  @ApiProperty({ description: 'Property type', enum: PropertyType })
  propertyType!: PropertyType;

  @ApiProperty({ description: 'City' })
  city!: string | null;

  @ApiProperty({ description: 'Country' })
  country!: string | null;

  @ApiProperty({ description: 'Price per night' })
  pricePerNight!: number;

  @ApiProperty({ description: 'Host user ID' })
  hostId!: string;
}

export class BookingResponseDto {
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

  @ApiProperty({ type: BookingPropertyDto, description: 'Property details' })
  property!: BookingPropertyDto;
}
