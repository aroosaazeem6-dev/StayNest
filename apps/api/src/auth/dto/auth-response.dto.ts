import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiProperty({ description: 'User display name' })
  name!: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  role!: UserRole;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt!: Date;
}

export class AuthTokensDto {
  @ApiProperty({ description: 'Short-lived JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'Opaque refresh token' })
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}

export class TokenPairDto {
  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}