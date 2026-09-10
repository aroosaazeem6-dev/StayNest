import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Prisma, Property, Favorite } from '@prisma/client';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { FavoriteListResponseDto } from './dto/favorite-list-response.dto';

type FavoriteWithRelations = Favorite & {
  property: Property;
};

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async add(
    guest: AuthenticatedUser,
    propertyId: string,
  ): Promise<FavoriteResponseDto> {
    // Verify the property exists before creating the favorite.
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // The DB unique constraint [guestId, propertyId] prevents duplicates.
    // We catch P2002 and translate it into a clean 409 Conflict.
    let favorite: FavoriteWithRelations;
    try {
      favorite = await this.prisma.favorite.create({
        data: {
          guestId: guest.id,
          propertyId,
        },
        include: { property: true },
      });
    } catch (err) {
      const code =
        err instanceof Prisma.PrismaClientKnownRequestError
          ? err.code
          : (err as { code?: string })?.code;
      if (code === 'P2002') {
        throw new ConflictException('Property is already in your favorites');
      }
      throw err;
    }

    return this.toResponseDto(favorite);
  }

  async remove(
    guest: AuthenticatedUser,
    propertyId: string,
  ): Promise<{ message: string }> {
    // Only remove the authenticated guest's own favorite.
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        guestId_propertyId: {
          guestId: guest.id,
          propertyId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { message: 'Favorite removed' };
  }

  async isFavorited(
    guest: AuthenticatedUser,
    propertyId: string,
  ): Promise<{ favorited: boolean }> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        guestId_propertyId: {
          guestId: guest.id,
          propertyId,
        },
      },
    });

    return { favorited: !!favorite };
  }

  async findMine(
    guest: AuthenticatedUser,
    query: { page?: number; limit?: number },
  ): Promise<FavoriteListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where: { guestId: guest.id },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { guestId: guest.id } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: data.map((favorite) => this.toResponseDto(favorite)),
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

  private toResponseDto(favorite: FavoriteWithRelations): FavoriteResponseDto {
    return {
      id: favorite.id,
      propertyId: favorite.propertyId,
      guestId: favorite.guestId,
      createdAt: favorite.createdAt.toISOString(),
      property: {
        id: favorite.property.id,
        title: favorite.property.title,
        propertyType: favorite.property.propertyType,
        city: favorite.property.city,
        country: favorite.property.country,
      },
    };
  }
}