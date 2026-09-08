import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import {
  Amenity,
  Prisma,
  Property,
  PropertyAmenity,
  PropertyImage,
  PropertyStatus,
  UserRole,
} from '@prisma/client';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyResponseDto } from './dto/property-response.dto';
import { PropertyListResponseDto } from './dto/property-list-response.dto';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto';
import { PaginationMetaDto } from './dto/property-list-response.dto';
import { CheckAvailabilityDto } from '../booking/dto/check-availability.dto';
import { BookingService } from '../booking/booking.service';
import * as crypto from 'node:crypto';

type PropertyWithRelations = Property & {
  images: PropertyImage[];
  amenities: (PropertyAmenity & { amenity: Amenity })[];
};

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingService: BookingService,
  ) {}

  async create(
    host: AuthenticatedUser,
    dto: CreatePropertyDto,
  ): Promise<PropertyResponseDto> {
    const property = await this.prisma.property.create({
      data: {
        hostId: host.id,
        title: dto.title,
        description: dto.description,
        propertyType: dto.propertyType,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        pricePerNight: dto.pricePerNight,
        maxGuests: dto.maxGuests,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        status: PropertyStatus.DRAFT,
        amenities: dto.amenityIds?.length
          ? {
              create: dto.amenityIds.map((aid) => ({
                amenity: { connect: { id: aid } },
              })),
            }
          : undefined,
        images: dto.imageUrls?.length
          ? {
              create: dto.imageUrls.map((url) => ({
                url,
                objectKey: crypto.randomUUID(),
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    return this.toResponseDto(property);
  }

  async findAll(
    query: FindPropertiesQueryDto,
  ): Promise<PropertyListResponseDto> {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException(
        'minPrice must be less than or equal to maxPrice',
      );
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.ACTIVE,
      ...(query.city && {
        city: { equals: query.city, mode: 'insensitive' },
      }),
      ...(query.country && {
        country: { equals: query.country, mode: 'insensitive' },
      }),
      ...(query.propertyType && { propertyType: query.propertyType }),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            pricePerNight: {
              ...(query.minPrice !== undefined && { gte: query.minPrice }),
              ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
            },
          }
        : {}),
      ...(query.minGuests !== undefined && {
        maxGuests: { gte: query.minGuests },
      }),
      ...(query.minBedrooms !== undefined && {
        bedrooms: { gte: query.minBedrooms },
      }),
    };

    let propertyIds: string[] | undefined;
    if (query.amenityIds) {
      const raw = Array.isArray(query.amenityIds)
        ? query.amenityIds
        : [query.amenityIds];
      const uniqueAmenityIds = [...new Set(raw.filter((id) => id.trim().length > 0))];
      if (uniqueAmenityIds.length > 0) {
        propertyIds = await this.findPropertyIdsWithAllAmenities(uniqueAmenityIds);
        if (propertyIds.length === 0) {
          return {
            data: [],
            meta: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            } as PaginationMetaDto,
          };
        }
        where.id = { in: propertyIds };
      }
    }

    const orderBy = this.buildOrderBy(query.sort);

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: true,
          amenities: { include: { amenity: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: properties.map((p) => this.toResponseDto(p)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      } as PaginationMetaDto,
    };
  }

  async findMine(host: AuthenticatedUser): Promise<PropertyResponseDto[]> {
    const properties = await this.prisma.property.findMany({
      where: { hostId: host.id },
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    return properties.map((p) => this.toResponseDto(p));
  }

  async findOne(
    id: string,
    requestingUser?: AuthenticatedUser,
  ): Promise<PropertyResponseDto> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== PropertyStatus.ACTIVE) {
      const isOwner =
        requestingUser !== undefined &&
        requestingUser.role === UserRole.HOST &&
        property.hostId === requestingUser.id;
      const isAdmin = requestingUser?.role === UserRole.ADMIN;

      if (!isOwner && !isAdmin) {
        throw new NotFoundException('Property not found');
      }
    }

    return this.toResponseDto(property);
  }

  async update(
    host: AuthenticatedUser,
    id: string,
    dto: UpdatePropertyDto,
  ): Promise<PropertyResponseDto> {
    await this.ensureCanManage(id, host);

    const data: Prisma.PropertyUpdateInput = {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.propertyType && { propertyType: dto.propertyType }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.state !== undefined && { state: dto.state }),
      ...(dto.country !== undefined && { country: dto.country }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.pricePerNight !== undefined && { pricePerNight: dto.pricePerNight }),
      ...(dto.maxGuests !== undefined && { maxGuests: dto.maxGuests }),
      ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
      ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
      ...(dto.status && { status: dto.status }),
    };

    if (dto.amenityIds !== undefined) {
      data.amenities = {
        deleteMany: {},
        create: dto.amenityIds.map((aid) => ({
          amenity: { connect: { id: aid } },
        })),
      };
    }

    const property = await this.prisma.property.update({
      where: { id },
      data,
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    return this.toResponseDto(property);
  }

  async remove(host: AuthenticatedUser, id: string): Promise<{ message: string }> {
    await this.ensureCanManage(id, host);

    await this.prisma.property.update({
      where: { id },
      data: { status: PropertyStatus.ARCHIVED },
    });

    return { message: 'Property archived successfully' };
  }

  async checkAvailability(
    id: string,
    dto: CheckAvailabilityDto,
  ): Promise<{ available: boolean }> {
    return this.bookingService.checkAvailability(id, dto);
  }

  private async ensureCanManage(
    propertyId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.HOST && property.hostId === user.id) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to manage this property',
    );
  }

  private async findPropertyIdsWithAllAmenities(
    amenityIds: string[],
  ): Promise<string[]> {
    if (amenityIds.length === 0) {
      return [];
    }

    const links = await this.prisma.propertyAmenity.findMany({
      where: {
        amenityId: { in: amenityIds },
        property: { status: PropertyStatus.ACTIVE },
      },
      select: {
        propertyId: true,
        amenityId: true,
      },
    });

    const counts = new Map<string, Set<string>>();
    for (const link of links) {
      if (!counts.has(link.propertyId)) {
        counts.set(link.propertyId, new Set());
      }
      counts.get(link.propertyId)!.add(link.amenityId);
    }

    return Array.from(counts.entries())
      .filter(([, ids]) => ids.size === amenityIds.length)
      .map(([propertyId]) => propertyId);
  }

  private buildOrderBy(
    sort?: string,
  ): Prisma.PropertyOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'price_asc':
        return { pricePerNight: 'asc' };
      case 'price_desc':
        return { pricePerNight: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private toResponseDto(property: PropertyWithRelations): PropertyResponseDto {
    return {
      id: property.id,
      hostId: property.hostId,
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      address: property.address,
      city: property.city,
      state: property.state,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      pricePerNight: property.pricePerNight.toNumber(),
      maxGuests: property.maxGuests,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      status: property.status,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      images: property.images.map((img) => ({
        id: img.id,
        url: img.url,
        objectKey: img.objectKey,
        createdAt: img.createdAt,
      })),
      amenities: property.amenities.map((pa) => ({
        id: pa.amenity.id,
        name: pa.amenity.name,
      })),
    };
  }
}
