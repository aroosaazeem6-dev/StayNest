import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class HostBookingPropertyDto {
  @ApiProperty({ description: 'Property ID' })
  id!: string;

  @ApiProperty({ description: 'Property title' })
  title!: string;

  @ApiProperty({ description: 'Property type' })
  propertyType!: string;

  @ApiProperty({ description: 'City', nullable: true })
  city!: string | null;

  @ApiProperty({ description: 'Country', nullable: true })
  country!: string | null;

  @ApiProperty({ description: 'Price per night' })
  pricePerNight!: number;

  @ApiProperty({ description: 'Cover image URL', nullable: true })
  coverImage!: string | null;
}

export class HostBookingGuestDto {
  @ApiProperty({ description: 'Guest user ID' })
  id!: string;

  @ApiProperty({ description: 'Guest name' })
  name!: string;

  @ApiProperty({ description: 'Guest email' })
  email!: string;
}

export class HostBookingResponseDto {
  @ApiProperty({ description: 'Booking ID' })
  id!: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId!: string;

  @ApiProperty({ description: 'Guest user ID' })
  guestId!: string;

  @ApiProperty({ description: 'Check-in date (YYYY-MM-DD)' })
  checkIn!: string;

  @ApiProperty({ description: 'Check-out date (YYYY-MM-DD)' })
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

  @ApiProperty({ type: HostBookingPropertyDto, description: 'Property details' })
  property!: HostBookingPropertyDto;

  @ApiProperty({ type: HostBookingGuestDto, description: 'Guest details' })
  guest!: HostBookingGuestDto;
}
