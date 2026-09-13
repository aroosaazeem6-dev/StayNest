import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PropertyStatus } from '@prisma/client';

export class UpdatePropertyStatusDto {
  @ApiProperty({
    description: 'New property status',
    enum: PropertyStatus,
    example: PropertyStatus.ARCHIVED,
  })
  @IsEnum(PropertyStatus)
  status!: PropertyStatus;
}