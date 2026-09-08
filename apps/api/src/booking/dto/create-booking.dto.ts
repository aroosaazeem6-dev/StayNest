import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Property ID to book',
    example: 'prop-001',
  })
  @IsString()
  @IsNotEmpty()
  propertyId!: string;

  @ApiProperty({
    description: 'Check-in date (ISO date string, e.g. 2026-11-01)',
    example: '2026-11-01',
  })
  @IsDateString()
  @IsNotEmpty()
  checkIn!: string;

  @ApiProperty({
    description: 'Check-out date (ISO date string, e.g. 2026-11-05)',
    example: '2026-11-05',
  })
  @IsDateString()
  @IsNotEmpty()
  checkOut!: string;

  @ApiProperty({
    description: 'Number of guests (must be <= property maxGuests)',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  guests!: number;
}
