import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from './decorators/current-user.decorator';

const isThrottleDisabled =
  process.env.DISABLE_AUTH_THROTTLE === '1' ||
  process.env.NODE_ENV === 'test';
const AUTH_THROTTLE = {
  default: { limit: isThrottleDisabled ? 100_000 : 5, ttl: 60_000 },
};
const AUTH_REFRESH_THROTTLE = {
  default: { limit: isThrottleDisabled ? 100_000 : 10, ttl: 60_000 },
};

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Register a new user (always GUEST role)' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_REFRESH_THROTTLE)
  @ApiOperation({ summary: 'Rotate refresh token and get a new access token' })
  @ApiResponse({ status: 200, type: TokenPairDto })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or revoked refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the supplied refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthResponseDto['user']> {
    return this.authService.me(user.id);
  }
}
