import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class CheckAvailabilityDto {
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
}
