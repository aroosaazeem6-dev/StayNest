import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Opaque refresh token previously issued by the auth API',
  })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}