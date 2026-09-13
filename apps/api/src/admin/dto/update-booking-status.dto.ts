import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'New booking status',
    enum: BookingStatus,
    example: BookingStatus.CANCELLED,
  })
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}