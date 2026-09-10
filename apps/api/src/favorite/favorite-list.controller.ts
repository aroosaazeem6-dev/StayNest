import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FavoriteService } from './favorite.service';
import { FavoriteListResponseDto } from './dto/favorite-list-response.dto';
import { ListFavoritesQueryDto } from './dto/list-favorites-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * Authenticated favorite-list endpoint.
 *
 *   GET /api/v1/favorites  (GUEST)
 */
@ApiTags('favorites')
@ApiBearerAuth()
@Controller({ path: 'favorites', version: '1' })
export class FavoriteListController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @Roles(UserRole.GUEST)
  @ApiOperation({ summary: 'List the authenticated guest\'s favorites (GUEST only, paginated)' })
  @ApiResponse({ status: 200, type: FavoriteListResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async findMine(
    @CurrentUser() guest: AuthenticatedUser,
    @Query() query: ListFavoritesQueryDto,
  ): Promise<FavoriteListResponseDto> {
    return this.favoriteService.findMine(guest, query);
  }
}