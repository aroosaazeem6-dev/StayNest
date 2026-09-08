process.env.DISABLE_AUTH_THROTTLE = '1';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole, PropertyStatus, PropertyType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const E2E_PASSWORD = 'E2eProperty123!';

const HOST_ID = 'e2e-prop-host';
const HOST_EMAIL = 'e2e-prop-host@staynest.test';

const ADMIN_ID = 'e2e-prop-admin';
const ADMIN_EMAIL = 'e2e-prop-admin@staynest.test';

const GUEST_ID = 'e2e-prop-guest';
const GUEST_EMAIL = 'e2e-prop-guest@staynest.test';

const AMENITY_IDS = {
  WIFI: 'e2e-amenity-wifi',
  KITCHEN: 'e2e-amenity-kitchen',
  POOL: 'e2e-amenity-pool',
};

describe('Property Endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://staynest:staynest_pass@localhost:5432/staynest';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin123';
    process.env.MINIO_BUCKET = process.env.MINIO_BUCKET || 'staynest';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-jwt-secret-32-chars-or-longer-padding';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
    process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '4';
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
    process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await bcrypt.hash(E2E_PASSWORD, 4);

    await prisma.propertyAmenity.deleteMany({
      where: {
        property: {
          hostId: { in: [HOST_ID, ADMIN_ID] },
        },
      },
    });
    await prisma.propertyImage.deleteMany({
      where: {
        property: {
          hostId: { in: [HOST_ID, ADMIN_ID] },
        },
      },
    });
    await prisma.property.deleteMany({
      where: { hostId: { in: [HOST_ID, ADMIN_ID] } },
    });
    const existingAmenities = await prisma.amenity.findMany({
      where: { name: { in: ['WiFi', 'Kitchen', 'Swimming Pool'] } },
      select: { id: true },
    });
    const existingAmenityIds = existingAmenities.map((a) => a.id);

    if (existingAmenityIds.length > 0) {
      await prisma.propertyAmenity.deleteMany({
        where: { amenityId: { in: existingAmenityIds } },
      });
      await prisma.amenity.deleteMany({
        where: { id: { in: existingAmenityIds } },
      });
    }

    await prisma.amenity.createMany({
      data: [
        { id: AMENITY_IDS.WIFI, name: 'WiFi' },
        { id: AMENITY_IDS.KITCHEN, name: 'Kitchen' },
        { id: AMENITY_IDS.POOL, name: 'Swimming Pool' },
      ],
    });

    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL] } },
    });

    await prisma.user.createMany({
      data: [
        { id: HOST_ID, email: HOST_EMAIL, name: 'E2E Host', passwordHash, role: UserRole.HOST },
        { id: ADMIN_ID, email: ADMIN_EMAIL, name: 'E2E Admin', passwordHash, role: UserRole.ADMIN },
        { id: GUEST_ID, email: GUEST_EMAIL, name: 'E2E Guest', passwordHash, role: UserRole.GUEST },
      ],
      skipDuplicates: true,
    });

    await prisma.property.createMany({
      data: [
        {
          id: 'e2e-prop-1',
          hostId: HOST_ID,
          title: 'Host Active 1',
          propertyType: PropertyType.APARTMENT,
          city: 'Denver',
          country: 'USA',
          pricePerNight: 100,
          maxGuests: 2,
          bedrooms: 2,
          status: PropertyStatus.ACTIVE,
        },
        {
          id: 'e2e-prop-2',
          hostId: HOST_ID,
          title: 'Host Active 2',
          propertyType: PropertyType.HOUSE,
          city: 'Boulder',
          country: 'USA',
          pricePerNight: 200,
          maxGuests: 4,
          bedrooms: 3,
          status: PropertyStatus.ACTIVE,
        },
        {
          id: 'e2e-prop-3',
          hostId: HOST_ID,
          title: 'Host Active 3',
          propertyType: PropertyType.COTTAGE,
          city: 'Aspen',
          country: 'USA',
          pricePerNight: 150,
          maxGuests: 3,
          bedrooms: 2,
          status: PropertyStatus.ACTIVE,
        },
        {
          id: 'e2e-prop-4',
          hostId: HOST_ID,
          title: 'Host Draft',
          propertyType: PropertyType.STUDIO,
          city: 'Portland',
          country: 'USA',
          pricePerNight: 80,
          maxGuests: 1,
          bedrooms: 1,
          status: PropertyStatus.DRAFT,
        },
        {
          id: 'e2e-prop-5',
          hostId: ADMIN_ID,
          title: 'Admin Active',
          propertyType: PropertyType.VILLA,
          city: 'Malibu',
          country: 'USA',
          pricePerNight: 500,
          maxGuests: 6,
          bedrooms: 4,
          status: PropertyStatus.ACTIVE,
        },
        {
          id: 'e2e-prop-6',
          hostId: ADMIN_ID,
          title: 'Admin Draft',
          propertyType: PropertyType.CASTLE,
          city: 'Edinburgh',
          country: 'UK',
          pricePerNight: 1000,
          maxGuests: 10,
          bedrooms: 5,
          status: PropertyStatus.DRAFT,
        },
      ],
      skipDuplicates: true,
    });

    await prisma.propertyAmenity.createMany({
      data: [
        { propertyId: 'e2e-prop-1', amenityId: AMENITY_IDS.WIFI },
        { propertyId: 'e2e-prop-2', amenityId: AMENITY_IDS.KITCHEN },
        { propertyId: 'e2e-prop-3', amenityId: AMENITY_IDS.POOL },
        { propertyId: 'e2e-prop-5', amenityId: AMENITY_IDS.WIFI },
      ],
      skipDuplicates: true,
    });

    await prisma.propertyImage.createMany({
      data: [
        { propertyId: 'e2e-prop-1', objectKey: 'key-1', url: 'https://example.com/1.jpg' },
        { propertyId: 'e2e-prop-2', objectKey: 'key-2', url: 'https://example.com/2.jpg' },
      ],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.propertyAmenity.deleteMany({
        where: {
          property: {
            hostId: { in: [HOST_ID, ADMIN_ID] },
          },
        },
      });
      await prisma.propertyImage.deleteMany({
        where: {
          property: {
            hostId: { in: [HOST_ID, ADMIN_ID] },
          },
        },
      });
      await prisma.property.deleteMany({
        where: { hostId: { in: [HOST_ID, ADMIN_ID] } },
      });
      await prisma.amenity.deleteMany({
        where: { id: { in: [AMENITY_IDS.WIFI, AMENITY_IDS.KITCHEN, AMENITY_IDS.POOL] } },
      });
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL] } },
      });
    }
    await app.close();
  });

  describe('POST /api/v1/properties', () => {
    it('rejects unauthenticated with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send({
          title: 'No Auth',
          propertyType: PropertyType.APARTMENT,
          pricePerNight: 100,
          maxGuests: 2,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('rejects guest with 403', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Guest Property',
          propertyType: PropertyType.APARTMENT,
          pricePerNight: 100,
          maxGuests: 2,
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('allows host to create a property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Host Property',
          propertyType: PropertyType.HOUSE,
          pricePerNight: 250,
          maxGuests: 4,
          amenityIds: [AMENITY_IDS.WIFI],
          imageUrls: ['https://example.com/new.jpg'],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Host Property');
      expect(res.body.data.status).toBe(PropertyStatus.DRAFT);
      expect(res.body.data.hostId).toBe(HOST_ID);
      expect(res.body.data.images).toHaveLength(1);
      expect(res.body.data.images[0].url).toBe('https://example.com/new.jpg');
      expect(res.body.data.amenities).toHaveLength(1);
      expect(res.body.data.amenities[0].id).toBe(AMENITY_IDS.WIFI);

      await prisma.propertyAmenity.deleteMany({
        where: { propertyId: res.body.data.id },
      });
      await prisma.propertyImage.deleteMany({
        where: { propertyId: res.body.data.id },
      });
      await prisma.property.delete({
        where: { id: res.body.data.id },
      });
    });

    it('allows admin to create a property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Admin Property',
          propertyType: PropertyType.VILLA,
          pricePerNight: 500,
          maxGuests: 6,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.title).toBe('Admin Property');
      expect(res.body.data.hostId).toBe(ADMIN_ID);

      await prisma.propertyAmenity.deleteMany({
        where: { propertyId: res.body.data.id },
      });
      await prisma.propertyImage.deleteMany({
        where: { propertyId: res.body.data.id },
      });
      await prisma.property.delete({
        where: { id: res.body.data.id },
      });
    });
  });

  describe('GET /api/v1/properties', () => {
    it('returns only ACTIVE properties with pagination metadata', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toBeDefined();
      expect(Array.isArray(res.body.data.data)).toBe(true);

      const allActive = res.body.data.data.every((p: any) => p.status === PropertyStatus.ACTIVE);
      expect(allActive).toBe(true);

      expect(res.body.data.meta).toBeDefined();
      expect(res.body.data.meta.total).toBeGreaterThanOrEqual(4);
      expect(res.body.data.meta.limit).toBe(10);
      expect(res.body.data.meta.page).toBe(1);
      expect(typeof res.body.data.meta.totalPages).toBe('number');
      expect(typeof res.body.data.meta.hasNext).toBe('boolean');
      expect(typeof res.body.data.meta.hasPrev).toBe('boolean');
    });

    it('excludes DRAFT properties from public listing', async () => {
      await prisma.property.updateMany({
        where: { id: { in: ['e2e-prop-1', 'e2e-prop-4'] } },
        data: { status: PropertyStatus.DRAFT },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .expect(HttpStatus.OK);

      const returnedIds = res.body.data.data.map((p: any) => p.id);
      expect(returnedIds).not.toContain('e2e-prop-1');
      expect(returnedIds).not.toContain('e2e-prop-4');

      await prisma.property.updateMany({
        where: { id: { in: ['e2e-prop-1', 'e2e-prop-4'] } },
        data: { status: PropertyStatus.ACTIVE },
      });
    });

    it('filters by minPrice', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?minPrice=150')
        .expect(HttpStatus.OK);

      const prices = res.body.data.data.map((p: any) => p.pricePerNight);
      prices.forEach((price: number) => {
        expect(price).toBeGreaterThanOrEqual(150);
      });
    });

    it('filters by maxPrice', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?maxPrice=150')
        .expect(HttpStatus.OK);

      const prices = res.body.data.data.map((p: any) => p.pricePerNight);
      prices.forEach((price: number) => {
        expect(price).toBeLessThanOrEqual(150);
      });
    });

    it('filters by minGuests', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?minGuests=4')
        .expect(HttpStatus.OK);

      const guestCounts = res.body.data.data.map((p: any) => p.maxGuests);
      guestCounts.forEach((count: number) => {
        expect(count).toBeGreaterThanOrEqual(4);
      });
    });

    it('filters by minBedrooms', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?minBedrooms=3')
        .expect(HttpStatus.OK);

      const bedroomCounts = res.body.data.data.map((p: any) => p.bedrooms);
      bedroomCounts.forEach((count: number) => {
        expect(count).toBeGreaterThanOrEqual(3);
      });
    });

    it('excludes properties with null bedrooms from minBedrooms filter', async () => {
      await prisma.property.update({
        where: { id: 'e2e-prop-1' },
        data: { bedrooms: null },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?minBedrooms=1')
        .expect(HttpStatus.OK);

      const returnedIds = res.body.data.data.map((p: any) => p.id);
      expect(returnedIds).not.toContain('e2e-prop-1');

      await prisma.property.update({
        where: { id: 'e2e-prop-1' },
        data: { bedrooms: 2 },
      });
    });

    it('filters by amenityIds with AND semantics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .query({ amenityIds: [AMENITY_IDS.WIFI] })
        .expect(HttpStatus.OK);

      const returnedIds = res.body.data.data.map((p: any) => p.id);
      expect(returnedIds).toContain('e2e-prop-1');
      expect(returnedIds).toContain('e2e-prop-5');
    });

    it('returns empty result when amenityIds AND yields no matches', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .query({ amenityIds: [AMENITY_IDS.WIFI, AMENITY_IDS.KITCHEN] })
        .expect(HttpStatus.OK);

      expect(res.body.data.data).toHaveLength(0);
    });

    it('sorts by price_asc', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?sort=price_asc')
        .expect(HttpStatus.OK);

      const prices = res.body.data.data.map((p: any) => p.pricePerNight);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('sorts by price_desc', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?sort=price_desc')
        .expect(HttpStatus.OK);

      const prices = res.body.data.data.map((p: any) => p.pricePerNight);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });

    it('defaults to newest sort', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .expect(HttpStatus.OK);

      expect(res.body.data.data.length).toBeGreaterThan(0);
    });

    it('combines city and price filters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties?city=Denver&minPrice=50&maxPrice=150')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      const allFromDenver = res.body.data.data.every((p: any) => p.city === 'Denver');
      expect(allFromDenver).toBe(true);
      const prices = res.body.data.data.map((p: any) => p.pricePerNight);
      prices.forEach((price: number) => {
        expect(price).toBeGreaterThanOrEqual(50);
        expect(price).toBeLessThanOrEqual(150);
      });
    });

    it('rejects invalid sort parameter with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/properties?sort=invalid_sort')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/properties/mine', () => {
    it('returns only properties owned by the authenticated host', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/v1/properties/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const allOwnedByHost = res.body.data.every((p: any) => p.hostId === HOST_ID);
      expect(allOwnedByHost).toBe(true);
    });

    it('rejects guest with 403', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .get('/api/v1/properties/mine')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /api/v1/properties/:id', () => {
    it('allows public to view an ACTIVE property', async () => {
      await prisma.property.update({
        where: { id: 'e2e-prop-1' },
        data: { status: PropertyStatus.ACTIVE },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/properties/e2e-prop-1')
        .expect(HttpStatus.OK);

      expect(res.body.data.title).toBe('Host Active 1');
      expect(res.body.data.status).toBe(PropertyStatus.ACTIVE);
    });

    it('returns 404 for DRAFT property to unauthenticated', async () => {
      await prisma.property.update({
        where: { id: 'e2e-prop-4' },
        data: { status: PropertyStatus.DRAFT },
      });

      await request(app.getHttpServer())
        .get('/api/v1/properties/e2e-prop-4')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('allows owner to view own DRAFT property', async () => {
      await prisma.property.update({
        where: { id: 'e2e-prop-4' },
        data: { status: PropertyStatus.DRAFT },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/v1/properties/e2e-prop-4')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.title).toBe('Host Draft');
      expect(res.body.data.status).toBe(PropertyStatus.DRAFT);
    });

    it('allows admin to view DRAFT property', async () => {
      await prisma.property.update({
        where: { id: 'e2e-prop-6' },
        data: { status: PropertyStatus.DRAFT },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/v1/properties/e2e-prop-6')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.title).toBe('Admin Draft');
    });

    it('returns 404 for non-existent property', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/properties/nonexistent-id')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/v1/properties/:id', () => {
    it('allows host to update own property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch('/api/v1/properties/e2e-prop-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Host Active 1 Updated' })
        .expect(HttpStatus.OK);

      expect(res.body.data.title).toBe('Host Active 1 Updated');
    });

    it('allows host to publish own property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch('/api/v1/properties/e2e-prop-4')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: PropertyStatus.ACTIVE })
        .expect(HttpStatus.OK);

      expect(res.body.data.status).toBe(PropertyStatus.ACTIVE);
    });

    it('allows host to unpublish own property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch('/api/v1/properties/e2e-prop-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: PropertyStatus.DRAFT })
        .expect(HttpStatus.OK);

      expect(res.body.data.status).toBe(PropertyStatus.DRAFT);

      await request(app.getHttpServer())
        .patch('/api/v1/properties/e2e-prop-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: PropertyStatus.ACTIVE })
        .expect(HttpStatus.OK);
    });

    it('allows admin to update any property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch('/api/v1/properties/e2e-prop-2')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Admin Updated Host 2' })
        .expect(HttpStatus.OK);

      expect(res.body.data.title).toBe('Admin Updated Host 2');
    });

    it('throws 403 when host tries to update another host property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .patch('/api/v1/properties/e2e-prop-5')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hacked' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('throws 404 for non-existent property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .patch('/api/v1/properties/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/properties/:id', () => {
    it('archives the property when host deletes own', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .delete('/api/v1/properties/e2e-prop-3')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.message).toBe('Property archived successfully');
      expect(res.body.success).toBe(true);

      const inDb = await prisma.property.findUnique({
        where: { id: 'e2e-prop-3' },
      });
      expect(inDb?.status).toBe(PropertyStatus.ARCHIVED);
    });

    it('returns 404 for ARCHIVED property to public', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/properties/e2e-prop-3')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('allows admin to archive any property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .delete('/api/v1/properties/e2e-prop-5')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.message).toBe('Property archived successfully');
    });

    it('throws 403 when host tries to archive another host property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .delete('/api/v1/properties/e2e-prop-6')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('throws 404 for non-existent property', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .delete('/api/v1/properties/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
