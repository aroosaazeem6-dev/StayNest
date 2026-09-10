import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  BookingStatus,
  Prisma,
  Property,
  Review,
} from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewListResponseDto } from './dto/review-list-response.dto';

type ReviewWithRelations = Review & {
  property: Property;
  guest: { id: string; name: string };
};

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    guest: AuthenticatedUser,
    propertyId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    // 1. Property must exist.
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // 2. Booking must exist and must belong to the specified property.
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.propertyId !== propertyId) {
      throw new BadRequestException('Booking does not belong to the specified property');
    }

    // 3. The authenticated user must be the guest who owns the booking.
    if (booking.guestId !== guest.id) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    // 4. Only COMPLETED stays can be reviewed.
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Only completed bookings can be reviewed',
      );
    }

    // 5. Create the review. The DB unique constraint on bookingId prevents
    //    duplicate reviews; we translate the Prisma error into a clean 400.
    let review: ReviewWithRelations;
    try {
      review = await this.prisma.review.create({
        data: {
          propertyId,
          guestId: guest.id,
          bookingId: dto.bookingId,
          rating: dto.rating,
          comment: dto.comment ?? null,
        },
        include: {
          property: true,
          guest: { select: { id: true, name: true } },
        },
      });
    } catch (err) {
      // P2002 = unique constraint violation (duplicate bookingId review).
      // Check both the Prisma typed error and plain-object fallbacks so
      // the guard works regardless of how the error is constructed.
      const code =
        err instanceof Prisma.PrismaClientKnownRequestError
          ? err.code
          : (err as { code?: string })?.code;
      if (code === 'P2002') {
        throw new BadRequestException('A review already exists for this booking');
      }
      throw err;
    }

    return this.toResponseDto(review);
  }

  async findByProperty(
    propertyId: string,
    query: ListReviewsQueryDto,
  ): Promise<ReviewListResponseDto> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = { propertyId };
    if (query.minRating !== undefined) {
      where.rating = { gte: query.minRating };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: {
          property: true,
          guest: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data.map((review) => this.toResponseDto(review)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        property: true,
        guest: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.toResponseDto(review);
  }

  private toResponseDto(review: ReviewWithRelations): ReviewResponseDto {
    return {
      id: review.id,
      propertyId: review.propertyId,
      guestId: review.guestId,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      property: {
        id: review.property.id,
        title: review.property.title,
        propertyType: review.property.propertyType,
        city: review.property.city,
        country: review.property.country,
      },
      guest: {
        id: review.guest.id,
        name: review.guest.name,
      },
    };
  }
}