import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecureP@ssw0rd',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}