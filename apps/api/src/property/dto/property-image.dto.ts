import { ApiProperty } from '@nestjs/swagger';

export class PropertyImageDto {
  @ApiProperty({ description: 'Image ID' })
  id!: string;

  @ApiProperty({ description: 'Image URL' })
  url!: string | null;

  @ApiProperty({ description: 'MinIO object key' })
  objectKey!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;
}
