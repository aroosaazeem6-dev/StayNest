import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewListResponseDto } from './dto/review-list-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('reviews')
@Controller({ path: 'properties/:propertyId/reviews', version: '1' })
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Roles(UserRole.GUEST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review for a completed stay (GUEST only)' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 201, type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or eligibility failure' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 403, description: 'Insufficient role or not the booking guest' })
  @ApiResponse({ status: 404, description: 'Property or booking not found' })
  async create(
    @CurrentUser() guest: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.create(guest, propertyId, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List reviews for a property (public, paginated)' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({ status: 200, type: ReviewListResponseDto })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async findAll(
    @Param('propertyId') propertyId: string,
    @Query() query: ListReviewsQueryDto,
  ): Promise<ReviewListResponseDto> {
    return this.reviewService.findByProperty(propertyId, query);
  }
}