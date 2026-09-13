import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

/**
 * Safe admin user response.
 *
 * Deliberately excludes:
 * - passwordHash
 * - refreshTokens
 * - any other authentication secrets
 */
export class AdminUserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id!: string;

  @ApiProperty({ description: 'User name' })
  name!: string;

  @ApiProperty({ description: 'User email' })
  email!: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role!: UserRole;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: string;
}