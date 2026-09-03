/* =============================================================================
 * StayNest Prisma Seed Script (Phase 1 + Phase 3)
 * =============================================================================
 * Creates development seed data.
 * All seeded users share the same development-only password:
 *   Password123!
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, UserRole, PropertyType, PropertyStatus, BookingStatus, PaymentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEED_DEV_PASSWORD = 'Password123!';
const SEED_USERS = [
  { id: 'admin-001', name: 'Admin User', email: 'admin@staynest.dev', role: UserRole.ADMIN },
  { id: 'host-001', name: 'Alice Host', email: 'host1@staynest.dev', role: UserRole.HOST },
  { id: 'host-002', name: 'Bob Host', email: 'host2@staynest.dev', role: UserRole.HOST },
  { id: 'guest-001', name: 'Charlie Guest', email: 'guest1@staynest.dev', role: UserRole.GUEST },
  { id: 'guest-002', name: 'Dana Guest', email: 'guest2@staynest.dev', role: UserRole.GUEST },
  { id: 'guest-003', name: 'Eli Guest', email: 'guest3@staynest.dev', role: UserRole.GUEST },
] as const;

async function seedUsers(): Promise<void> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const passwordHash = await bcrypt.hash(SEED_DEV_PASSWORD, rounds);

  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { passwordHash, name: user.name, role: user.role },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }
  console.log(`Seeded ${SEED_USERS.length} users (1 admin, 2 hosts, 3 guests) with dev password: ${SEED_DEV_PASSWORD}`);
}

async function main(): Promise<void> {
  console.log('Seeding development data...');

  // ---- Users ----
  await seedUsers();
// ---- Amenities ----
  await prisma.amenity.createMany({
    data: [
      { name: 'WiFi' },
      { name: 'Kitchen' },
      { name: 'Swimming Pool' },
      { name: 'Air Conditioning' },
      { name: 'Free Parking' },
      { name: 'Washer/Dryer' },
      { name: 'Hot Tub' },
      { name: 'Fireplace' },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded 8 amenities');

  const amenityRecords = await prisma.amenity.findMany({
    where: { name: { in: ['WiFi', 'Kitchen', 'Swimming Pool', 'Air Conditioning', 'Free Parking', 'Washer/Dryer', 'Hot Tub', 'Fireplace'] } },
    select: { id: true, name: true },
  });
  const amenityByName = new Map(amenityRecords.map((a) => [a.name, a.id]));

  // ---- Properties ----
  await prisma.property.createMany({
    data: [
      {
        id: 'prop-001', hostId: 'host-001', title: 'Cozy Mountain Cabin', description: 'A charming cabin in the mountains with panoramic views.',
        propertyType: PropertyType.COTTAGE, address: '123 Mountain View Rd', city: 'Aspen', state: 'CO', country: 'USA',
        latitude: 39.1911, longitude: -106.8175, pricePerNight: 250.00, maxGuests: 4, bedrooms: 2, bathrooms: 1.5, status: PropertyStatus.ACTIVE,
      },
      {
        id: 'prop-002', hostId: 'host-001', title: 'Downtown Loft Apartment', description: 'Modern loft in the heart of the city.',
        propertyType: PropertyType.APARTMENT, address: '456 City Center Ave', city: 'Denver', state: 'CO', country: 'USA',
        latitude: 39.7392, longitude: -104.9903, pricePerNight: 180.00, maxGuests: 2, bedrooms: 1, bathrooms: 1.0, status: PropertyStatus.ACTIVE,
      },
      {
        id: 'prop-003', hostId: 'host-002', title: 'Beachfront Villa', description: 'Luxury villa right on the beach.',
        propertyType: PropertyType.VILLA, address: '789 Ocean Blvd', city: 'Malibu', state: 'CA', country: 'USA',
        latitude: 34.0259, longitude: -118.6917, pricePerNight: 850.00, maxGuests: 8, bedrooms: 4, bathrooms: 3.5, status: PropertyStatus.ACTIVE,
      },
      {
        id: 'prop-004', hostId: 'host-002', title: 'Countryside Farmhouse', description: 'Rustic farmhouse surrounded by fields.',
        propertyType: PropertyType.HOUSE, address: '321 Country Lane', city: 'Boulder', state: 'CO', country: 'USA',
        latitude: 40.0150, longitude: -105.2705, pricePerNight: 320.00, maxGuests: 6, bedrooms: 3, bathrooms: 2.0, status: PropertyStatus.ACTIVE,
      },
      {
        id: 'prop-005', hostId: 'host-001', title: 'Urban Studio', description: 'Compact studio apartment in a trendy neighborhood.',
        propertyType: PropertyType.STUDIO, address: '654 Urban St', city: 'Portland', state: 'OR', country: 'USA',
        latitude: 45.5152, longitude: -122.6784, pricePerNight: 120.00, maxGuests: 2, bedrooms: 0, bathrooms: 1.0, status: PropertyStatus.ACTIVE,
      },
    ],
    skipDuplicates: false,
  });
  console.log('Seeded 5 properties');

  // ---- Property Amenities (junction table) ----
  const propertyAmenities: { propertyId: string; amenityId: string }[] = [
    // Cabin
    { propertyId: 'prop-001', amenityId: amenityByName.get('WiFi')! },
    { propertyId: 'prop-001', amenityId: amenityByName.get('Kitchen')! },
    { propertyId: 'prop-001', amenityId: amenityByName.get('Air Conditioning')! },
    { propertyId: 'prop-001', amenityId: amenityByName.get('Free Parking')! },
    { propertyId: 'prop-001', amenityId: amenityByName.get('Fireplace')! },
    // Loft
    { propertyId: 'prop-002', amenityId: amenityByName.get('WiFi')! },
    { propertyId: 'prop-002', amenityId: amenityByName.get('Kitchen')! },
    { propertyId: 'prop-002', amenityId: amenityByName.get('Air Conditioning')! },
    // Villa
    { propertyId: 'prop-003', amenityId: amenityByName.get('WiFi')! },
    { propertyId: 'prop-003', amenityId: amenityByName.get('Kitchen')! },
    { propertyId: 'prop-003', amenityId: amenityByName.get('Swimming Pool')! },
    { propertyId: 'prop-003', amenityId: amenityByName.get('Free Parking')! },
    { propertyId: 'prop-003', amenityId: amenityByName.get('Hot Tub')! },
    // Farmhouse
    { propertyId: 'prop-004', amenityId: amenityByName.get('WiFi')! },
    { propertyId: 'prop-004', amenityId: amenityByName.get('Kitchen')! },
    { propertyId: 'prop-004', amenityId: amenityByName.get('Free Parking')! },
    { propertyId: 'prop-004', amenityId: amenityByName.get('Washer/Dryer')! },
    { propertyId: 'prop-004', amenityId: amenityByName.get('Fireplace')! },
    // Studio
    { propertyId: 'prop-005', amenityId: amenityByName.get('WiFi')! },
    { propertyId: 'prop-005', amenityId: amenityByName.get('Kitchen')! },
    { propertyId: 'prop-005', amenityId: amenityByName.get('Air Conditioning')! },
  ];
  await prisma.propertyAmenity.createMany({
    data: propertyAmenities,
    skipDuplicates: true,
  });
  console.log('Seeded 21 property-amenity links');

  // ---- Availability (10 days per property) ----
  const availability: { propertyId: string; date: Date; isAvailable: boolean }[] = [];
  const props = ['prop-001', 'prop-002', 'prop-003', 'prop-004', 'prop-005'];
  const startDate = new Date('2026-01-01T00:00:00.000Z');
  for (const propId of props) {
    for (let i = 0; i < 10; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      availability.push({ propertyId: propId, date: d, isAvailable: true });
    }
  }
  await prisma.availability.createMany({
    data: availability,
    skipDuplicates: true,
  });
  console.log('Seeded 50 availability entries');

  // ---- Bookings ----
  await prisma.booking.createMany({
    data: [
      {
        id: 'bk-001', propertyId: 'prop-001', guestId: 'guest-001', checkIn: new Date('2026-02-01'), checkOut: new Date('2026-02-03'),
        guests: 2, status: BookingStatus.CONFIRMED, totalAmount: 500.00, createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'bk-002', propertyId: 'prop-002', guestId: 'guest-002', checkIn: new Date('2026-02-10'), checkOut: new Date('2026-02-12'),
        guests: 2, status: BookingStatus.COMPLETED, totalAmount: 360.00, createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'bk-003', propertyId: 'prop-003', guestId: 'guest-003', checkIn: new Date('2026-03-01'), checkOut: new Date('2026-03-05'),
        guests: 4, status: BookingStatus.CONFIRMED, totalAmount: 3400.00, createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'bk-004', propertyId: 'prop-001', guestId: 'guest-002', checkIn: new Date('2026-02-05'), checkOut: new Date('2026-02-07'),
        guests: 3, status: BookingStatus.PENDING, totalAmount: 500.00, createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded 4 bookings');

  // ---- Reviews (linked to bookings) ----
  await prisma.review.createMany({
    data: [
      {
        id: 'rev-001', propertyId: 'prop-001', guestId: 'guest-001', bookingId: 'bk-001', rating: 5, comment: 'Amazing cabin! Perfect for our getaway.', createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'rev-002', propertyId: 'prop-002', guestId: 'guest-002', bookingId: 'bk-002', rating: 4, comment: 'Great location, clean and modern.', createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'rev-003', propertyId: 'prop-003', guestId: 'guest-003', bookingId: 'bk-003', rating: 5, comment: 'Luxury at its best. Highly recommend.', createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded 3 reviews');

  // ---- Favorites ----
  await prisma.favorite.createMany({
    data: [
      { id: 'fav-001', guestId: 'guest-001', propertyId: 'prop-003', createdAt: new Date() },
      { id: 'fav-002', guestId: 'guest-001', propertyId: 'prop-005', createdAt: new Date() },
      { id: 'fav-003', guestId: 'guest-002', propertyId: 'prop-001', createdAt: new Date() },
      { id: 'fav-004', guestId: 'guest-002', propertyId: 'prop-004', createdAt: new Date() },
      { id: 'fav-005', guestId: 'guest-003', propertyId: 'prop-001', createdAt: new Date() },
      { id: 'fav-006', guestId: 'guest-003', propertyId: 'prop-002', createdAt: new Date() },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded 6 favorites');

  // ---- Payments ----
  await prisma.payment.createMany({
    data: [
      {
        id: 'pay-001', bookingId: 'bk-001', amount: 500.00, currency: 'usd', status: PaymentStatus.SUCCEEDED, provider: 'stripe_test', providerReference: 'pi_001', createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'pay-002', bookingId: 'bk-002', amount: 360.00, currency: 'usd', status: PaymentStatus.SUCCEEDED, provider: 'stripe_test', providerReference: 'pi_002', createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'pay-003', bookingId: 'bk-003', amount: 3400.00, currency: 'usd', status: PaymentStatus.SUCCEEDED, provider: 'stripe_test', providerReference: 'pi_003', createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 'pay-004', bookingId: 'bk-004', amount: 500.00, currency: 'usd', status: PaymentStatus.PENDING, provider: 'stripe_test', providerReference: 'pi_004', createdAt: new Date(), updatedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });
  console.log('Seeded 4 payments');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });