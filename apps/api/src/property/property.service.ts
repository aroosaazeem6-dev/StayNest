import {
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
import * as crypto from 'node:crypto';

type PropertyWithRelations = Property & {
  images: PropertyImage[];
  amenities: (PropertyAmenity & { amenity: Amenity })[];
};

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

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
    };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
