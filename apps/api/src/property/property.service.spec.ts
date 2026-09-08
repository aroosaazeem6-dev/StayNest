import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from './property.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  Amenity,
  Prisma,
  Property,
  PropertyAmenity,
  PropertyImage,
  PropertyStatus,
  PropertyType,
  UserRole,
} from '@prisma/client';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

type MockPrismaService = {
  property: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
};

describe('PropertyService', () => {
  let service: PropertyService;
  let prisma: MockPrismaService;

  const mockAmenity: Amenity = {
    id: 'amenity-1',
    name: 'WiFi',
  };

  const mockImage: PropertyImage = {
    id: 'img-1',
    propertyId: 'prop-1',
    objectKey: 'object-key-1',
    url: 'https://example.com/image1.jpg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockPropertyAmenity: PropertyAmenity & { amenity: Amenity } = {
    propertyId: 'prop-1',
    amenityId: 'amenity-1',
    amenity: mockAmenity,
  };

  const mockProperty: Property & {
    images: PropertyImage[];
    amenities: (PropertyAmenity & { amenity: Amenity })[];
  } = {
    id: 'prop-1',
    hostId: 'host-1',
    title: 'Cozy Cabin',
    description: 'A nice cabin',
    propertyType: PropertyType.COTTAGE,
    address: '123 Forest Rd',
    city: 'Aspen',
    state: 'CO',
    country: 'USA',
    latitude: 39.1911,
    longitude: -106.8175,
    pricePerNight: new Prisma.Decimal(250.0),
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1.5,
    status: PropertyStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    images: [mockImage],
    amenities: [mockPropertyAmenity],
  };

  const hostUser: AuthenticatedUser = {
    id: 'host-1',
    email: 'host@test.com',
    role: UserRole.HOST,
  };

  const adminUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  };

  const otherHostUser: AuthenticatedUser = {
    id: 'host-2',
    email: 'other@test.com',
    role: UserRole.HOST,
  };

  beforeEach(async () => {
    const mockPrisma: MockPrismaService = {
      property: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
  });

  describe('create', () => {
    it('creates a property with DRAFT status and hostId from the user', async () => {
      const dto: CreatePropertyDto = {
        title: 'Test Cabin',
        propertyType: PropertyType.COTTAGE,
        pricePerNight: 100,
        maxGuests: 2,
      };

      const created = {
        ...mockProperty,
        id: 'new-prop-1',
        title: dto.title,
        status: PropertyStatus.DRAFT,
        hostId: hostUser.id,
        pricePerNight: new Prisma.Decimal(dto.pricePerNight),
      };
      prisma.property.create.mockResolvedValue(created);

      const result = await service.create(hostUser, dto);

      expect(result.id).toBe('new-prop-1');
      expect(result.title).toBe('Test Cabin');
      expect(result.status).toBe(PropertyStatus.DRAFT);
      expect(result.hostId).toBe('host-1');
      expect(result.pricePerNight).toBe(100);
      expect(prisma.property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hostId: 'host-1',
            status: PropertyStatus.DRAFT,
            title: 'Test Cabin',
            propertyType: PropertyType.COTTAGE,
          }),
        }),
      );
    });

    it('creates property images from imageUrls', async () => {
      const dto: CreatePropertyDto = {
        title: 'Test Cabin',
        propertyType: PropertyType.COTTAGE,
        pricePerNight: 100,
        maxGuests: 2,
        imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      };

      prisma.property.create.mockResolvedValue(mockProperty);

      await service.create(hostUser, dto);

      const callArg = prisma.property.create.mock.calls[0][0];
      expect(callArg.data.images).toBeDefined();
      expect(callArg.data.images.create).toHaveLength(2);
      expect(callArg.data.images.create[0].url).toBe('https://example.com/img1.jpg');
      expect(callArg.data.images.create[0].objectKey).toEqual(expect.any(String));
    });

    it('creates amenity associations when amenityIds provided', async () => {
      const dto: CreatePropertyDto = {
        title: 'Test Cabin',
        propertyType: PropertyType.COTTAGE,
        pricePerNight: 100,
        maxGuests: 2,
        amenityIds: ['amenity-1', 'amenity-2'],
      };

      prisma.property.create.mockResolvedValue(mockProperty);

      await service.create(hostUser, dto);

      const callArg = prisma.property.create.mock.calls[0][0];
      expect(callArg.data.amenities).toBeDefined();
      expect(callArg.data.amenities.create).toHaveLength(2);
      expect(callArg.data.amenities.create[0].amenity.connect.id).toBe('amenity-1');
    });

    it('does not create amenities when amenityIds not provided', async () => {
      const dto: CreatePropertyDto = {
        title: 'Test Cabin',
        propertyType: PropertyType.COTTAGE,
        pricePerNight: 100,
        maxGuests: 2,
      };

      prisma.property.create.mockResolvedValue(mockProperty);

      await service.create(hostUser, dto);

      const callArg = prisma.property.create.mock.calls[0][0];
      expect(callArg.data.amenities).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns only ACTIVE properties with pagination metadata', async () => {
      prisma.property.findMany.mockResolvedValue([mockProperty]);
      prisma.property.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('prop-1');
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('applies default page and limit when not provided', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(0);
    });

    it('clamps limit to maximum of 50', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 100 });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('filters by city when provided', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.findAll({ city: 'Aspen' });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { equals: 'Aspen', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('filters by propertyType when provided', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await service.findAll({ propertyType: PropertyType.APARTMENT });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyType: PropertyType.APARTMENT,
          }),
        }),
      );
    });

    it('calculates hasNext and hasPrev correctly', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(false);
    });
  });

  describe('findMine', () => {
    it('returns all properties for the given host including non-ACTIVE', async () => {
      const draftProperty = { ...mockProperty, status: PropertyStatus.DRAFT };
      prisma.property.findMany.mockResolvedValue([mockProperty, draftProperty]);

      const result = await service.findMine(hostUser);

      expect(result).toHaveLength(2);
      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { hostId: 'host-1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns an ACTIVE property to unauthenticated users', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      const result = await service.findOne('prop-1');

      expect(result.id).toBe('prop-1');
      expect(result.status).toBe(PropertyStatus.ACTIVE);
    });

    it('throws NotFoundException for non-existent property', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns a DRAFT property to its owner (HOST)', async () => {
      const draftProperty = { ...mockProperty, status: PropertyStatus.DRAFT };
      prisma.property.findUnique.mockResolvedValue(draftProperty);

      const result = await service.findOne('prop-1', hostUser);

      expect(result.status).toBe(PropertyStatus.DRAFT);
    });

    it('returns a DRAFT property to ADMIN', async () => {
      const draftProperty = { ...mockProperty, status: PropertyStatus.DRAFT };
      prisma.property.findUnique.mockResolvedValue(draftProperty);

      const result = await service.findOne('prop-1', adminUser);

      expect(result.status).toBe(PropertyStatus.DRAFT);
    });

    it('throws NotFoundException for DRAFT property to unauthenticated users', async () => {
      const draftProperty = { ...mockProperty, status: PropertyStatus.DRAFT };
      prisma.property.findUnique.mockResolvedValue(draftProperty);

      await expect(service.findOne('prop-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException for DRAFT property to non-owner HOST', async () => {
      const draftProperty = { ...mockProperty, status: PropertyStatus.DRAFT };
      prisma.property.findUnique.mockResolvedValue(draftProperty);

      await expect(service.findOne('prop-1', otherHostUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException for DRAFT property to GUEST', async () => {
      const draftProperty = { ...mockProperty, status: PropertyStatus.DRAFT };
      prisma.property.findUnique.mockResolvedValue(draftProperty);
      const guestUser: AuthenticatedUser = {
        id: 'guest-1',
        email: 'guest@test.com',
        role: UserRole.GUEST,
      };

      await expect(service.findOne('prop-1', guestUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates a property when the host is the owner', async () => {
      const dto: UpdatePropertyDto = {
        title: 'Updated Title',
        pricePerNight: 300,
      };
      const updated = { ...mockProperty, title: 'Updated Title', pricePerNight: new Prisma.Decimal(300) };
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.property.update.mockResolvedValue(updated);

      const result = await service.update(hostUser, 'prop-1', dto);

      expect(result.title).toBe('Updated Title');
      expect(result.pricePerNight).toBe(300);
    });

    it('allows ADMIN to update any property', async () => {
      const dto: UpdatePropertyDto = { title: 'Admin Updated' };
      const updated = { ...mockProperty, title: 'Admin Updated' };
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.property.update.mockResolvedValue(updated);

      const result = await service.update(adminUser, 'prop-1', dto);

      expect(result.title).toBe('Admin Updated');
    });

    it('throws ForbiddenException when host is not the owner', async () => {
      const dto: UpdatePropertyDto = { title: 'Hacked' };
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.update(otherHostUser, 'prop-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when property does not exist', async () => {
      const dto: UpdatePropertyDto = { title: 'Test' };
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.update(hostUser, 'nonexistent', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('replaces amenities when amenityIds is provided', async () => {
      const dto: UpdatePropertyDto = {
        amenityIds: ['amenity-1', 'amenity-2'],
      };
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.property.update.mockResolvedValue(mockProperty);

      await service.update(hostUser, 'prop-1', dto);

      expect(prisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amenities: {
              deleteMany: {},
              create: [
                { amenity: { connect: { id: 'amenity-1' } } },
                { amenity: { connect: { id: 'amenity-2' } } },
              ],
            },
          }),
        }),
      );
    });

    it('updates status when provided', async () => {
      const dto: UpdatePropertyDto = { status: PropertyStatus.ACTIVE };
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.property.update.mockResolvedValue({ ...mockProperty, status: PropertyStatus.ACTIVE });

      const result = await service.update(hostUser, 'prop-1', dto);

      expect(result.status).toBe(PropertyStatus.ACTIVE);
    });
  });

  describe('remove', () => {
    it('archives the property when the host is the owner', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.property.update.mockResolvedValue({ ...mockProperty, status: PropertyStatus.ARCHIVED });

      const result = await service.remove(hostUser, 'prop-1');

      expect(result.message).toBe('Property archived successfully');
      expect(prisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { status: PropertyStatus.ARCHIVED },
      });
    });

    it('archives the property for ADMIN', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.property.update.mockResolvedValue({ ...mockProperty, status: PropertyStatus.ARCHIVED });

      const result = await service.remove(adminUser, 'prop-1');

      expect(result.message).toBe('Property archived successfully');
    });

    it('throws ForbiddenException when host is not the owner', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.remove(otherHostUser, 'prop-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when property does not exist', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.remove(hostUser, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
