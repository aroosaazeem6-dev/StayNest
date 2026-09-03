process.env.DISABLE_AUTH_THROTTLE = '1';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestOnlyController } from './test-only.controller';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const TEST_EMAIL = 'e2e-auth-user@staynest.test';
const TEST_PASSWORD = 'E2eTestPassword123!';
const ADMIN_EMAIL = 'e2e-auth-admin@staynest.test';
const HOST_EMAIL = 'e2e-auth-host@staynest.test';
const GUEST_EMAIL = 'e2e-auth-guest@staynest.test';

describe('Auth Endpoints (e2e)', () => {
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
      controllers: [TestOnlyController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1', prefix: 'api/v' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up any leftover from previous test runs
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [TEST_EMAIL, ADMIN_EMAIL, HOST_EMAIL, GUEST_EMAIL] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [TEST_EMAIL, ADMIN_EMAIL, HOST_EMAIL, GUEST_EMAIL] } },
    });

    // Seed test users in beforeAll so tests are order-independent
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
    await prisma.user.create({
      data: { id: 'e2e-test-user', email: TEST_EMAIL, name: 'E2E Auth User', passwordHash, role: UserRole.GUEST },
    });
    await prisma.user.create({
      data: { id: 'e2e-test-admin', email: ADMIN_EMAIL, name: 'E2E Admin', passwordHash, role: UserRole.ADMIN },
    });
    await prisma.user.create({
      data: { id: 'e2e-test-host', email: HOST_EMAIL, name: 'E2E Host', passwordHash, role: UserRole.HOST },
    });
    await prisma.user.create({
      data: { id: 'e2e-test-guest', email: GUEST_EMAIL, name: 'E2E Guest', passwordHash, role: UserRole.GUEST },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { in: [TEST_EMAIL, ADMIN_EMAIL, HOST_EMAIL, GUEST_EMAIL] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [TEST_EMAIL, ADMIN_EMAIL, HOST_EMAIL, GUEST_EMAIL] } },
      });
    }
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user, returns user + tokens (no passwordHash)', async () => {
      // Use a unique email to avoid conflict with the seeded user
      const email = 'e2e-register-test@staynest.test';
      await prisma.user.deleteMany({ where: { email } });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: TEST_PASSWORD, name: 'E2E Register' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.role).toBe(UserRole.GUEST);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      const dbUser = await prisma.user.findUnique({ where: { email } });
      expect(dbUser).toBeTruthy();
      expect(dbUser!.role).toBe(UserRole.GUEST);

      await prisma.user.delete({ where: { email } });
    });

    it('rejects duplicate email with 409', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Dup' })
        .expect(HttpStatus.CONFLICT);
    });

    it('rejects invalid email with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: TEST_PASSWORD, name: 'Bad' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('rejects short password with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'short-pw@staynest.test', password: 'short', name: 'Short' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('rejects extra fields (whitelist) - role cannot be set', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'role-spoof@staynest.test',
          password: TEST_PASSWORD,
          name: 'Spoof',
          role: 'ADMIN',
        })
        .expect(HttpStatus.BAD_REQUEST);

      const dbUser = await prisma.user.findUnique({ where: { email: 'role-spoof@staynest.test' } });
      expect(dbUser).toBeNull();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(HttpStatus.OK);

      expect(res.body.data.user.email).toBe(TEST_EMAIL);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: 'WrongPassword999!' })
        .expect(HttpStatus.UNAUTHORIZED);
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('rejects unknown email with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@staynest.test', password: TEST_PASSWORD })
        .expect(HttpStatus.UNAUTHORIZED);
      expect(res.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('returns the authenticated user', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(HttpStatus.OK);

      const accessToken = login.body.data.tokens.accessToken;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.email).toBe(TEST_EMAIL);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('rejects an invalid token with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not.a.real.jwt')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('rotates a valid refresh token and returns a new pair', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(HttpStatus.OK);

      const oldRefresh = login.body.data.tokens.refreshToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefresh })
        .expect(HttpStatus.OK);

      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).not.toBe(oldRefresh);
    });

    it('rejects a reused (rotated) refresh token with 401', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(HttpStatus.OK);

      const oldRefresh = login.body.data.tokens.refreshToken;

      // First refresh: succeeds, oldRefresh is now revoked
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefresh })
        .expect(HttpStatus.OK);

      // Second refresh with the same token: fails
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefresh })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('rejects an unknown refresh token with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'a'.repeat(64) })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the supplied refresh token', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(HttpStatus.OK);

      const refreshToken = login.body.data.tokens.refreshToken;
      const accessToken = login.body.data.tokens.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('rejects logout without auth token with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'x' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('RBAC (test-only controller)', () => {
    let adminToken: string;
    let hostToken: string;
    let guestToken: string;

    beforeAll(async () => {
      const adminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: TEST_PASSWORD });
      adminToken = adminLogin.body.data.tokens.accessToken;

      const hostLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: HOST_EMAIL, password: TEST_PASSWORD });
      hostToken = hostLogin.body.data.tokens.accessToken;

      const guestLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: GUEST_EMAIL, password: TEST_PASSWORD });
      guestToken = guestLogin.body.data.tokens.accessToken;
    });

    it('admin can access /test-only/admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test-only/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);
    });

    it('host gets 403 on /test-only/admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test-only/admin')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('guest gets 403 on /test-only/admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test-only/admin')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('host can access /test-only/host-or-admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test-only/host-or-admin')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(HttpStatus.OK);
    });

    it('guest gets 403 on /test-only/host-or-admin', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test-only/host-or-admin')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
