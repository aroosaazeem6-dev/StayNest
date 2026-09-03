import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'SecureP@ssw0rd',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    description: 'User display name',
    example: 'Jane Doe',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}