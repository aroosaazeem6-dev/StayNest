import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ReviewService } from './review.service';
import { ReviewResponseDto } from './dto/review-response.dto';

/**
 * Review-by-id endpoint.
 *
 * Mounted at the root so the final route is:
 *   GET /api/v1/reviews/:id
 *
 * This is separate from the property-scoped review controller because the
 * route does not include a propertyId prefix.
 */
@ApiTags('reviews')
@Public()
@Controller({ path: 'reviews', version: '1' })
export class ReviewDetailsController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get(':id')
  @ApiExcludeEndpoint(true)
  @ApiOperation({ summary: 'Get a review by ID (public)' })
  @ApiResponse({ status: 200, type: ReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findById(
    @Param('id') id: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.findById(id);
  }
}