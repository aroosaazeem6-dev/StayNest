import { ApiProperty } from '@nestjs/swagger';
import { FavoritePropertyDto } from './favorite-property.dto';

export class FavoriteResponseDto {
  @ApiProperty({ description: 'Favorite ID' })
  id!: string;

  @ApiProperty({ description: 'Property ID' })
  propertyId!: string;

  @ApiProperty({ description: 'Guest user ID' })
  guestId!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ type: FavoritePropertyDto, description: 'Safe property details' })
  property!: FavoritePropertyDto;
}