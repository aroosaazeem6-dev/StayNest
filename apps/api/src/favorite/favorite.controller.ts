import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FavoriteService } from './favorite.service';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * Property-scoped favorite endpoints.
 *
 *   POST   /api/v1/properties/:propertyId/favorite  (GUEST)
 *   DELETE /api/v1/properties/:propertyId/favorite  (GUEST)
 *   GET    /api/v1/properties/:propertyId/favorite  (GUEST)
 */
@ApiTags('favorites')
@ApiBearerAuth()
@Controller({ path: 'properties/:propertyId/favorite', version: '1' })
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @Roles(UserRole.GUEST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a property to favorites (GUEST only)' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 201, type: FavoriteResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 409, description: 'Property already favorited' })
  async add(
    @CurrentUser() guest: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ): Promise<FavoriteResponseDto> {
    return this.favoriteService.add(guest, propertyId);
  }

  @Delete()
  @Roles(UserRole.GUEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a property from favorites (GUEST only)' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Favorite removed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async remove(
    @CurrentUser() guest: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ): Promise<{ message: string }> {
    return this.favoriteService.remove(guest, propertyId);
  }

  @Get()
  @Roles(UserRole.GUEST)
  @ApiOperation({ summary: 'Check if the current guest has favorited a property (GUEST only)' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { favorited: { type: 'boolean' } } } })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async isFavorited(
    @CurrentUser() guest: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
  ): Promise<{ favorited: boolean }> {
    return this.favoriteService.isFavorited(guest, propertyId);
  }
}