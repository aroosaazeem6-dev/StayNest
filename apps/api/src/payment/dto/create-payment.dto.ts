import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Booking ID to create payment for',
    example: 'bk-1',
  })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;
}