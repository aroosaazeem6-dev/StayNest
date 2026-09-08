process.env.DISABLE_AUTH_THROTTLE = '1';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole, PropertyStatus, BookingStatus, PropertyType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const E2E_PASSWORD = 'E2eBooking123!';

const HOST_ID = 'e2e-booking-host';
const HOST_EMAIL = 'e2e-booking-host@staynest.test';

const ADMIN_ID = 'e2e-booking-admin';
const ADMIN_EMAIL = 'e2e-booking-admin@staynest.test';

const GUEST_ID = 'e2e-booking-guest';
const GUEST_EMAIL = 'e2e-booking-guest@staynest.test';

const OTHER_GUEST_ID = 'e2e-booking-other-guest';
const OTHER_GUEST_EMAIL = 'e2e-booking-other-guest@staynest.test';

const OTHER_HOST_ID = 'e2e-booking-other-host';
const OTHER_HOST_EMAIL = 'e2e-booking-other-host@staynest.test';

const PROPERTY_ID = 'e2e-booking-prop';
const OTHER_PROPERTY_ID = 'e2e-booking-other-prop';

describe('Booking Endpoints (e2e)', () => {
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

    await prisma.booking.deleteMany({
      where: {
        property: {
          hostId: { in: [HOST_ID, ADMIN_ID] },
        },
      },
    });
    await prisma.property.deleteMany({
      where: { hostId: { in: [HOST_ID, ADMIN_ID] } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL, OTHER_GUEST_EMAIL, OTHER_HOST_EMAIL] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL, OTHER_GUEST_EMAIL, OTHER_HOST_EMAIL] } },
    });

    await prisma.user.createMany({
      data: [
        { id: HOST_ID, email: HOST_EMAIL, name: 'E2E Host', passwordHash, role: UserRole.HOST },
        { id: ADMIN_ID, email: ADMIN_EMAIL, name: 'E2E Admin', passwordHash, role: UserRole.ADMIN },
        { id: GUEST_ID, email: GUEST_EMAIL, name: 'E2E Guest', passwordHash, role: UserRole.GUEST },
        { id: OTHER_GUEST_ID, email: OTHER_GUEST_EMAIL, name: 'E2E Other Guest', passwordHash, role: UserRole.GUEST },
        { id: OTHER_HOST_ID, email: OTHER_HOST_EMAIL, name: 'E2E Other Host', passwordHash, role: UserRole.HOST },
      ],
      skipDuplicates: true,
    });

    await prisma.property.createMany({
      data: [
        {
          id: PROPERTY_ID,
          hostId: HOST_ID,
          title: 'E2E Booking Property',
          propertyType: PropertyType.APARTMENT,
          city: 'Denver',
          country: 'USA',
          pricePerNight: 100,
          maxGuests: 4,
          bedrooms: 2,
          status: PropertyStatus.ACTIVE,
        },
        {
          id: OTHER_PROPERTY_ID,
          hostId: ADMIN_ID,
          title: 'E2E Other Property',
          propertyType: PropertyType.HOUSE,
          city: 'Boulder',
          country: 'USA',
          pricePerNight: 200,
          maxGuests: 6,
          bedrooms: 3,
          status: PropertyStatus.ACTIVE,
        },
      ],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.booking.deleteMany({
        where: {
          property: {
            hostId: { in: [HOST_ID, ADMIN_ID] },
          },
        },
      });
      await prisma.property.deleteMany({
        where: { hostId: { in: [HOST_ID, ADMIN_ID] } },
      });
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL, OTHER_GUEST_EMAIL] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [HOST_EMAIL, ADMIN_EMAIL, GUEST_EMAIL, OTHER_GUEST_EMAIL] } },
      });
    }
    await app.close();
  });

  describe('POST /api/v1/properties/:propertyId/availability/check', () => {
    it('returns available for free dates', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/properties/${PROPERTY_ID}/availability/check`)
        .send({ checkIn: '2027-01-01', checkOut: '2027-01-05' })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.available).toBe(true);
    });

    it('returns unavailable for overlapping PENDING booking', async () => {
      await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2027-02-01'),
          checkOut: new Date('2027-02-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/properties/${PROPERTY_ID}/availability/check`)
        .send({ checkIn: '2027-02-03', checkOut: '2027-02-06' })
        .expect(HttpStatus.OK);

      expect(res.body.data.available).toBe(false);

      await prisma.booking.deleteMany({
        where: { propertyId: PROPERTY_ID, guestId: GUEST_ID },
      });
    });

    it('allows adjacent bookings (checkOut == existing checkIn)', async () => {
      await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2027-03-01'),
          checkOut: new Date('2027-03-05'),
          guests: 2,
          status: BookingStatus.CONFIRMED,
          totalAmount: 400,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/properties/${PROPERTY_ID}/availability/check`)
        .send({ checkIn: '2027-03-05', checkOut: '2027-03-10' })
        .expect(HttpStatus.OK);

      expect(res.body.data.available).toBe(true);

      await prisma.booking.deleteMany({
        where: { propertyId: PROPERTY_ID, guestId: GUEST_ID },
      });
    });

    it('returns 404 for nonexistent property', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/properties/nonexistent/availability/check')
        .send({ checkIn: '2027-01-01', checkOut: '2027-01-05' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('returns 404 for inactive property', async () => {
      await prisma.property.update({
        where: { id: PROPERTY_ID },
        data: { status: PropertyStatus.DRAFT },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/properties/${PROPERTY_ID}/availability/check`)
        .send({ checkIn: '2027-01-01', checkOut: '2027-01-05' })
        .expect(HttpStatus.NOT_FOUND);

      await prisma.property.update({
        where: { id: PROPERTY_ID },
        data: { status: PropertyStatus.ACTIVE },
      });
    });

    it('rejects past checkIn', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastStr = pastDate.toISOString().split('T')[0];

      await request(app.getHttpServer())
        .post(`/api/v1/properties/${PROPERTY_ID}/availability/check`)
        .send({ checkIn: pastStr, checkOut: '2027-01-05' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('rejects checkOut <= checkIn', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/properties/${PROPERTY_ID}/availability/check`)
        .send({ checkIn: '2027-01-05', checkOut: '2027-01-05' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/bookings', () => {
    it('rejects unauthenticated with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          propertyId: PROPERTY_ID,
          checkIn: '2027-05-01',
          checkOut: '2027-05-05',
          guests: 2,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('rejects non-GUEST role', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: '2027-05-01',
          checkOut: '2027-05-05',
          guests: 2,
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('allows guest to create a booking', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: '2027-06-01',
          checkOut: '2027-06-05',
          guests: 2,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.PENDING);
      expect(res.body.data.totalAmount).toBe(400);
      expect(res.body.data.guests).toBe(2);
      expect(res.body.data.property.id).toBe(PROPERTY_ID);

      await prisma.booking.deleteMany({
        where: { id: res.body.data.id },
      });
    });

    it('rejects overlapping dates', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2027-07-01'),
          checkOut: new Date('2027-07-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: '2027-07-03',
          checkOut: '2027-07-07',
          guests: 2,
        })
        .expect(HttpStatus.CONFLICT);

      await prisma.booking.deleteMany({
        where: { propertyId: PROPERTY_ID, guestId: GUEST_ID },
      });
    });

    it('rejects guests > maxGuests', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: '2027-08-01',
          checkOut: '2027-08-05',
          guests: 10,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('rejects past checkIn', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastStr = pastDate.toISOString().split('T')[0];

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: pastStr,
          checkOut: '2027-01-05',
          guests: 2,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('rejects checkOut <= checkIn', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: '2027-09-05',
          checkOut: '2027-09-05',
          guests: 2,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('rejects inactive property', async () => {
      await prisma.property.update({
        where: { id: PROPERTY_ID },
        data: { status: PropertyStatus.DRAFT },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          propertyId: PROPERTY_ID,
          checkIn: '2027-10-01',
          checkOut: '2027-10-05',
          guests: 2,
        })
        .expect(HttpStatus.NOT_FOUND);

      await prisma.property.update({
        where: { id: PROPERTY_ID },
        data: { status: PropertyStatus.ACTIVE },
      });
    });
  });

  describe('GET /api/v1/bookings/my', () => {
    it('returns only the current guests bookings', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2027-11-01'),
          checkOut: new Date('2027-11-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
      const allOwned = res.body.data.data.every((b: any) => b.guestId === GUEST_ID);
      expect(allOwned).toBe(true);

      await prisma.booking.deleteMany({
        where: { propertyId: PROPERTY_ID, guestId: GUEST_ID },
      });
    });

    it('rejects non-GUEST role', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .get('/api/v1/bookings/my')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('allows guest to view own booking', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2027-12-01'),
          checkOut: new Date('2027-12-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(booking.id);

      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it('allows host to view booking for their property', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2027-12-10'),
          checkOut: new Date('2027-12-14'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const hostLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const hostToken = hostLogin.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(booking.id);

      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it('allows admin to view any booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2027-12-20'),
          checkOut: new Date('2027-12-24'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const adminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const adminToken = adminLogin.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(booking.id);

      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it('rejects guest viewing another guests booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2028-01-01'),
          checkOut: new Date('2028-01-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const otherLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: OTHER_GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const otherToken = otherLogin.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .get(`/api/v1/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(HttpStatus.FORBIDDEN);

      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it('rejects host viewing unrelated property booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2028-02-01'),
          checkOut: new Date('2028-02-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const otherHostLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: OTHER_HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const otherHostToken = otherHostLogin.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .get(`/api/v1/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${otherHostToken}`)
        .expect(HttpStatus.FORBIDDEN);

      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });

  describe('PATCH /api/v1/bookings/:id/cancel', () => {
    it('allows guest to cancel own PENDING booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2028-03-01'),
          checkOut: new Date('2028-03-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.status).toBe(BookingStatus.CANCELLED);
    });

    it('allows host to cancel booking for their property', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2028-04-01'),
          checkOut: new Date('2028-04-05'),
          guests: 2,
          status: BookingStatus.CONFIRMED,
          totalAmount: 400,
        },
      });

      const hostLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const hostToken = hostLogin.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.status).toBe(BookingStatus.CANCELLED);

      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it('allows admin to cancel any booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2028-05-01'),
          checkOut: new Date('2028-05-05'),
          guests: 2,
          status: BookingStatus.PENDING,
          totalAmount: 400,
        },
      });

      const adminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const adminToken = adminLogin.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.status).toBe(BookingStatus.CANCELLED);

      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it('rejects cancelling already CANCELLED booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2028-06-01'),
          checkOut: new Date('2028-06-05'),
          guests: 2,
          status: BookingStatus.CANCELLED,
          totalAmount: 400,
        },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it('rejects cancelling COMPLETED booking', async () => {
      const booking = await prisma.booking.create({
        data: {
          propertyId: PROPERTY_ID,
          guestId: GUEST_ID,
          checkIn: new Date('2028-07-01'),
          checkOut: new Date('2028-07-05'),
          guests: 2,
          status: BookingStatus.COMPLETED,
          totalAmount: 400,
        },
      });

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: E2E_PASSWORD })
        .expect(HttpStatus.OK);

      const token = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .patch(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.BAD_REQUEST);

      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });
});
