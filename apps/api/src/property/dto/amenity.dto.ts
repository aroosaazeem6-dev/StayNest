import { ApiProperty } from '@nestjs/swagger';

export class AmenityDto {
  @ApiProperty({ description: 'Amenity ID' })
  id!: string;

  @ApiProperty({ description: 'Amenity name', example: 'WiFi' })
  name!: string;
}
